const API_BASE = window.API_URL || window.API_BASE || 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const CABINET_TRANSLATIONS = {
        AZ: {
            userFallback: 'istifadəçi',
            roleAdmin: 'Admin Hesab',
            roleVip: 'VIP Hesab',
            rolePro: 'PRO Hesab',
            roleStandard: 'Standart Hesab',
            adminSwitch: 'Adminliyə keç',
            adminPanel: 'Admin paneli',
            dashboardWelcome: 'Xoş gəldiniz, {{name}}. Bugünkü statistikanızla tanış olun.',
            statusActive: 'Aktiv',
            statusPending: 'Yoxlanılır',
            statusRejected: 'Rədd edildi',
            statusArchived: 'Arxivdə',
            statusSold: 'Satılıb',
            noAds: 'Hələ sizin elanınız yoxdur.',
            loadingAds: 'Elanlar yüklənir...',
            adsLoadError: 'Elanlar yüklənmədi.',
            walletRedirect: 'Ödəniş sisteminə yönləndirilir...',
            profileSaved: 'Profil məlumatları yadda saxlanıldı!',
            nameRequired: 'Ad boş ola bilməz.',
            currentPasswordRequired: 'Cari şifrəni daxil edin.',
            passwordMin: 'Şifrə ən azı 6 simvol olmalıdır.',
            securitySaved: 'Təhlükəsizlik tənzimləmələri yadda saxlanıldı!',
            privacySaved: 'Məxfilik tənzimləmələri yadda saxlanıldı!',
            deleteAdConfirm: 'Bu elanı silmək istədiyinizdən əminsiniz?',
            adDeleted: 'Elan silindi.',
            freezeConfirm: 'Hesabınızı dondurmaq istədiyinizdən əminsiniz? Bütün aktiv elanlarınız gizlədiləcək.',
            accountFrozen: 'Hesabınız donduruldu. Sistemdən çıxış edilir...',
            deleteConfirmOne: 'XƏBƏRDARLIQ: Hesabınız və bütün məlumatlarınız həmişəlik silinəcək. Davam etmək istəyirsiniz?',
            deleteConfirmTwo: 'Son təsdiq: Bu əməliyyat GERİ QAYTARILA BİLMƏZ. Silmək istəyirsiniz?',
            accountDeleted: 'Hesabınız silindi. Yönləndirilirsiniz...',
            promoNotReady: 'Elan tanıtımı hissəsi hələ backend-ə qoşulmayıb.',
            copySuccess: 'Referal linki kopyalandı!'
        },
        ENG: {
            userFallback: 'user',
            roleAdmin: 'Admin Account',
            roleVip: 'VIP Account',
            rolePro: 'PRO Account',
            roleStandard: 'Standard Account',
            adminSwitch: 'Switch to Admin',
            adminPanel: 'Admin Panel',
            dashboardWelcome: 'Welcome, {{name}}. Review your stats for today.',
            statusActive: 'Active',
            statusPending: 'Pending Review',
            statusRejected: 'Rejected',
            statusArchived: 'Archived',
            statusSold: 'Sold',
            noAds: 'You do not have any ads yet.',
            loadingAds: 'Loading ads...',
            adsLoadError: 'Ads could not be loaded.',
            walletRedirect: 'Redirecting to the payment system...',
            profileSaved: 'Profile information has been saved!',
            nameRequired: 'First name cannot be empty.',
            currentPasswordRequired: 'Enter your current password.',
            passwordMin: 'Password must be at least 6 characters long.',
            securitySaved: 'Security settings have been saved!',
            privacySaved: 'Privacy settings have been saved!',
            deleteAdConfirm: 'Are you sure you want to delete this ad?',
            adDeleted: 'Ad deleted.',
            freezeConfirm: 'Are you sure you want to freeze your account? All active ads will be hidden.',
            accountFrozen: 'Your account has been frozen. Signing out...',
            deleteConfirmOne: 'WARNING: Your account and all your data will be deleted permanently. Do you want to continue?',
            deleteConfirmTwo: 'Final confirmation: This action CANNOT BE UNDONE. Do you want to delete it?',
            accountDeleted: 'Your account has been deleted. Redirecting...',
            promoNotReady: 'The ad promotion section is not connected to the backend yet.',
            copySuccess: 'Referral link copied!'
        },
        RUS: {
            userFallback: 'пользователь',
            roleAdmin: 'Админ-аккаунт',
            roleVip: 'VIP-аккаунт',
            rolePro: 'PRO-аккаунт',
            roleStandard: 'Стандартный аккаунт',
            adminSwitch: 'Перейти в админку',
            adminPanel: 'Админ-панель',
            dashboardWelcome: 'Добро пожаловать, {{name}}. Ознакомьтесь с вашей статистикой за сегодня.',
            statusActive: 'Активно',
            statusPending: 'На проверке',
            statusRejected: 'Отклонено',
            statusArchived: 'В архиве',
            statusSold: 'Продано',
            noAds: 'У вас пока нет объявлений.',
            loadingAds: 'Загрузка объявлений...',
            adsLoadError: 'Не удалось загрузить объявления.',
            walletRedirect: 'Переход к платежной системе...',
            profileSaved: 'Данные профиля сохранены!',
            nameRequired: 'Имя не может быть пустым.',
            currentPasswordRequired: 'Введите текущий пароль.',
            passwordMin: 'Пароль должен содержать не менее 6 символов.',
            securitySaved: 'Настройки безопасности сохранены!',
            privacySaved: 'Настройки конфиденциальности сохранены!',
            deleteAdConfirm: 'Вы уверены, что хотите удалить это объявление?',
            adDeleted: 'Объявление удалено.',
            freezeConfirm: 'Вы уверены, что хотите заморозить аккаунт? Все активные объявления будут скрыты.',
            accountFrozen: 'Ваш аккаунт заморожен. Выполняется выход...',
            deleteConfirmOne: 'ВНИМАНИЕ: Ваш аккаунт и все данные будут удалены навсегда. Продолжить?',
            deleteConfirmTwo: 'Последнее подтверждение: Это действие НЕЛЬЗЯ ОТМЕНИТЬ. Удалить?',
            accountDeleted: 'Ваш аккаунт удален. Перенаправление...',
            promoNotReady: 'Раздел продвижения объявления пока не подключен к backend.',
            copySuccess: 'Реферальная ссылка скопирована!'
        }
    };

    class ToastNotifier {
        constructor() {
            this.container = document.querySelector('.cab-toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'cab-toast-container';
                document.body.appendChild(this.container);
            }
        }

        show(message, type = 'success', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `cab-toast cab-toast-${type}`;

            let iconClass = 'fas fa-info';
            if (type === 'success') iconClass = 'fas fa-check';
            if (type === 'warning') iconClass = 'fas fa-exclamation';
            if (type === 'error') iconClass = 'fas fa-times';

            toast.innerHTML = `
                <div class="cab-toast-icon"><i class="${iconClass}"></i></div>
                <span>${message}</span>
            `;

            this.container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, duration);
        }
    }

    window.toast = new ToastNotifier();
    const toast = window.toast;

    function getToken() {
        const token = window.getAuthToken ? window.getAuthToken() : (sessionStorage.getItem('token') || '');
        return token || localStorage.getItem('token') || '';
    }

    function getCurrentLang() {
        const lang = localStorage.getItem('lang');
        return lang === 'ENG' || lang === 'RUS' ? lang : 'AZ';
    }

    function getLocale() {
        const localeMap = {
            AZ: 'az-AZ',
            ENG: 'en-GB',
            RUS: 'ru-RU'
        };

        return localeMap[getCurrentLang()] || 'az-AZ';
    }

    function t(key, fallback = '') {
        const lang = getCurrentLang();
        return CABINET_TRANSLATIONS[lang]?.[key]
            || window.translations?.[lang]?.[key]
            || fallback;
    }

    window.cabinetT = t;

    const BILLING_COPY = {
        AZ: {
            billingHeading: 'Paketlər və ödənişlər',
            subtitle: 'Hesabınıza uyğun paketi seçin, ödənişi tamamlayın və üstünlükləri dərhal aktivləşdirin.',
            topUpBalance: 'Balansı artır',
            currentPackage: 'Cari paket',
            historyTitle: 'Ödəniş tarixçəsi',
            walletBalance: 'Balans',
            selectedDuration: 'Müddət',
            nextPayment: 'Növbəti ödəniş',
            whyUpgrade: 'Niyə yüksəldəsiniz?',
            highlightTitle: 'Daha çox görünürlük, daha rahat ödəniş axını',
            highlightFastTitle: 'Sürətli seçim',
            highlightFastText: 'Paket, müddət və ödəniş üsulu bir yerdə aydın göstərilir.',
            highlightGrowthTitle: 'Aydın üstünlüklər',
            highlightGrowthText: 'Hər paket üzrə elan limiti və görünürlük fərqi əvvəlcədən görünür.',
            highlightTrustTitle: 'Etibarlı ödəniş',
            highlightTrustText: 'Ödənişdən əvvəl yekun məbləğ və seçilmiş üsul dəqiq göstərilir.',
            choosePackage: 'Paket seçin',
            choosePackageHint: 'Elan sayınıza və satış həcminizə uyğun paketi seçin.',
            duration30: '30 gün',
            duration90: '90 gün',
            paymentMethod: 'Ödəniş üsulu',
            paymentMethodHint: 'Ödənişi tamamlamaq üçün uyğun üsulu seçin.',
            orderSummary: 'Sifariş xülasəsi',
            summaryPackage: 'Paket',
            summaryDuration: 'Müddət',
            summaryMethod: 'Üsul',
            summaryTotal: 'Yekun',
            confirmPurchase: 'Paketi aktivləşdir',
            needBalance: 'Balansı artır',
            historyHint: 'Son ödənişlər və aktivləşdirmələr burada görünür.',
            historyEmpty: 'Hələ heç bir ödəniş əməliyyatı yoxdur.',
            currentPlan: 'Cari plan',
            freePlan: 'Pulsuz',
            featuredPopular: 'Ən çox seçilən',
            featuredMax: 'Ən güclü',
            methodWallet: 'Daxili balans',
            methodWalletDesc: 'Balans kifayət edirsə, paket dərhal aktivləşir.',
            methodCard: 'Bank kartı',
            methodCardDesc: 'Visa və Mastercard ilə onlayn ödəniş edin.',
            methodTransfer: 'Köçürmə / qaimə',
            methodTransferDesc: 'Hüquqi şəxslər üçün qaimə və bank köçürməsi.',
            enoughBalance: 'Balans kifayətdir',
            lowBalance: 'Balans azdır',
            fastest: 'Ən sürətli',
            secure: 'Təhlükəsiz',
            pendingLabel: 'Gözləyir',
            inactiveStatus: 'Aktiv deyil',
            currentPackageNoteStandard: 'Hazırda standart hesabdan istifadə edirsiniz. Daha çox görünürlük üçün paket seçin.',
            currentPackageNoteVip: 'VIP paket elanlarınıza daha çox diqqət gətirir və görünürlüğü artırır.',
            currentPackageNotePro: 'PRO paket maksimum görünürlük, prioritet yerləşdirmə və güclü üstünlüklər verir.',
            nextPaymentNone: 'Planlaşdırılmayıb',
            daysRemaining: '{{count}} gün qalıb',
            activeDurationNone: 'Aktiv deyil',
            noPaymentRequired: 'Ödəniş tələb olunmur',
            purchaseSuccess: 'Paket uğurla aktivləşdirildi.',
            insufficientBalance: 'Balans kifayət etmir. Əvvəlcə balansınızı artırın.',
            redirectCard: 'Kart ödənişinə keçid başladılır.',
            redirectTransfer: 'Qaimə və köçürmə məlumatları açılır.',
            historyPaid: 'Ödənilib',
            historyPending: 'Gözləyir',
            historyPackage: 'paketi',
            historyActivated: 'aktiv edildi',
            historyMethod: 'Üsul',
            standardDescription: 'Fərdi istifadəçilər üçün sadə başlanğıc paketi.',
            vipDescription: 'Daha çox elan və daha güclü görünürlük istəyənlər üçün.',
            proDescription: 'Mağazalar və peşəkar satıcılar üçün tam paket həlli.',
            standardFeature1: '3 aktiv elan',
            standardFeature2: 'Standart sıralama',
            standardFeature3: 'E-poçt bildirişləri',
            vipFeature1: '10 aktiv elan',
            vipFeature2: 'VIP nişanı və vurğulanan kart',
            vipFeature3: 'Daha sürətli moderasiya',
            proFeature1: '25 aktiv elan',
            proFeature2: 'Ana səhifədə üstün görünürlük',
            proFeature3: 'Prioritet dəstək və analitika',
            selectNow: 'Seç',
            selectedNow: 'Seçildi',
            includedPlan: 'Daxildir',
            perPeriod: 'müddət üçün'
        },
        ENG: {
            billingHeading: 'Packages and payments',
            subtitle: 'Choose the right package, complete payment, and activate the benefits instantly.',
            topUpBalance: 'Top up balance',
            currentPackage: 'Current package',
            historyTitle: 'Payment history',
            walletBalance: 'Balance',
            selectedDuration: 'Duration',
            nextPayment: 'Next payment',
            whyUpgrade: 'Why upgrade?',
            highlightTitle: 'More visibility, less friction',
            highlightFastTitle: 'Faster selection',
            highlightFastText: 'Package, term, and payment method are shown together.',
            highlightGrowthTitle: 'Clear value',
            highlightGrowthText: 'Each plan explains the visibility and listing difference.',
            highlightTrustTitle: 'Safer checkout',
            highlightTrustText: 'The final amount and method are confirmed before payment.',
            choosePackage: 'Choose a package',
            choosePackageHint: 'Pick the level that matches your activity.',
            duration30: '30 days',
            duration90: '90 days',
            paymentMethod: 'Payment method',
            paymentMethodHint: 'Select the payment channel you want to use.',
            orderSummary: 'Order summary',
            summaryPackage: 'Package',
            summaryDuration: 'Duration',
            summaryMethod: 'Method',
            summaryTotal: 'Total',
            confirmPurchase: 'Activate package',
            needBalance: 'Need balance?',
            historyHint: 'Your recent transactions appear here.',
            historyEmpty: 'No payment activity yet.',
            currentPlan: 'Current plan',
            freePlan: 'Free',
            featuredPopular: 'Popular',
            featuredMax: 'Maximum',
            methodWallet: 'Internal wallet',
            methodWalletDesc: 'If balance is enough, activation is instant.',
            methodCard: 'Bank card',
            methodCardDesc: 'Pay online with Visa or Mastercard.',
            methodTransfer: 'Transfer / invoice',
            methodTransferDesc: 'Invoice and transfer flow for legal entities.',
            enoughBalance: 'Enough balance',
            lowBalance: 'Low balance',
            fastest: 'Fastest',
            secure: 'Secure',
            pendingLabel: 'Pending',
            inactiveStatus: 'Inactive',
            currentPackageNoteStandard: 'You are on the standard account. Upgrade for more visibility.',
            currentPackageNoteVip: 'VIP gives your listings more attention in the feed.',
            currentPackageNotePro: 'PRO unlocks maximum visibility and premium placement.',
            nextPaymentNone: 'Not scheduled',
            daysRemaining: '{{count}} days left',
            activeDurationNone: 'Inactive',
            noPaymentRequired: 'No payment required',
            purchaseSuccess: 'Package activated successfully.',
            insufficientBalance: 'Not enough balance. Top up first.',
            redirectCard: 'Redirecting to card payment.',
            redirectTransfer: 'Opening invoice and transfer instructions.',
            historyPaid: 'Paid',
            historyPending: 'Pending',
            historyPackage: 'package',
            historyActivated: 'activated',
            historyMethod: 'Method',
            standardDescription: 'A simple starting point for individual sellers.',
            vipDescription: 'For users who want more listings and stronger visibility.',
            proDescription: 'Maximum package for stores and active sellers.',
            standardFeature1: '3 active ads',
            standardFeature2: 'Regular ranking',
            standardFeature3: 'Email notifications',
            vipFeature1: '10 active ads',
            vipFeature2: 'VIP badge and highlighted card',
            vipFeature3: 'Faster moderation',
            proFeature1: '25 active ads',
            proFeature2: 'Homepage priority visibility',
            proFeature3: 'Priority support and analytics',
            selectNow: 'Choose',
            selectedNow: 'Selected',
            includedPlan: 'Included',
            perPeriod: 'per period'
        },
        RUS: {
            billingHeading: 'Пакеты и платежи',
            subtitle: 'Выберите подходящий пакет, завершите оплату и сразу активируйте преимущества.',
            topUpBalance: 'Пополнить баланс',
            currentPackage: 'Текущий пакет',
            historyTitle: 'История платежей',
            walletBalance: 'Баланс',
            selectedDuration: 'Срок',
            nextPayment: 'Следующий платеж',
            whyUpgrade: 'Зачем повышать тариф?',
            highlightTitle: 'Больше видимости, меньше лишних шагов',
            highlightFastTitle: 'Быстрый выбор',
            highlightFastText: 'Пакет, срок и способ оплаты собраны в одном месте.',
            highlightGrowthTitle: 'Понятные преимущества',
            highlightGrowthText: 'Лимиты и уровень видимости каждого пакета видны сразу.',
            highlightTrustTitle: 'Надежная оплата',
            highlightTrustText: 'Перед оплатой показываются итоговая сумма и выбранный способ.',
            choosePackage: 'Выберите пакет',
            choosePackageHint: 'Подберите пакет под количество объявлений и ваш темп продаж.',
            duration30: '30 дней',
            duration90: '90 дней',
            paymentMethod: 'Способ оплаты',
            paymentMethodHint: 'Выберите удобный способ для завершения оплаты.',
            orderSummary: 'Сводка заказа',
            summaryPackage: 'Пакет',
            summaryDuration: 'Срок',
            summaryMethod: 'Способ',
            summaryTotal: 'Итого',
            confirmPurchase: 'Активировать пакет',
            needBalance: 'Пополнить баланс',
            historyHint: 'Здесь отображаются последние платежи и активации.',
            historyEmpty: 'Платежных операций пока нет.',
            currentPlan: 'Текущий план',
            freePlan: 'Бесплатно',
            featuredPopular: 'Самый популярный',
            featuredMax: 'Максимум',
            methodWallet: 'Внутренний баланс',
            methodWalletDesc: 'Если средств достаточно, пакет активируется сразу.',
            methodCard: 'Банковская карта',
            methodCardDesc: 'Онлайн-оплата картами Visa и Mastercard.',
            methodTransfer: 'Перевод / счет',
            methodTransferDesc: 'Счет и банковский перевод для юридических лиц.',
            enoughBalance: 'Средств хватает',
            lowBalance: 'Недостаточно средств',
            fastest: 'Быстрее всего',
            secure: 'Безопасно',
            pendingLabel: 'Ожидает',
            inactiveStatus: 'Не активен',
            currentPackageNoteStandard: 'Сейчас у вас стандартный аккаунт. Обновите пакет для большей видимости.',
            currentPackageNoteVip: 'VIP-пакет делает ваши объявления заметнее и привлекает больше внимания.',
            currentPackageNotePro: 'PRO-пакет дает максимальную видимость и приоритетное размещение.',
            nextPaymentNone: 'Не запланирован',
            daysRemaining: 'Осталось {{count}} дней',
            activeDurationNone: 'Не активен',
            noPaymentRequired: 'Оплата не требуется',
            purchaseSuccess: 'Пакет успешно активирован.',
            insufficientBalance: 'Недостаточно средств. Сначала пополните баланс.',
            redirectCard: 'Запускается переход к оплате картой.',
            redirectTransfer: 'Открываются реквизиты для счета и перевода.',
            historyPaid: 'Оплачено',
            historyPending: 'Ожидает',
            historyPackage: 'пакет',
            historyActivated: 'активирован',
            historyMethod: 'Способ',
            standardDescription: 'Простой стартовый пакет для частных продавцов.',
            vipDescription: 'Для тех, кому нужно больше объявлений и лучшая видимость.',
            proDescription: 'Полный пакет для магазинов и профессиональных продавцов.',
            standardFeature1: '3 активных объявления',
            standardFeature2: 'Стандартная выдача',
            standardFeature3: 'Email-уведомления',
            vipFeature1: '10 активных объявлений',
            vipFeature2: 'VIP-значок и выделенная карточка',
            vipFeature3: 'Более быстрая модерация',
            proFeature1: '25 активных объявлений',
            proFeature2: 'Приоритетная видимость на главной',
            proFeature3: 'Приоритетная поддержка и аналитика',
            selectNow: 'Выбрать',
            selectedNow: 'Выбрано',
            includedPlan: 'Включено',
            perPeriod: 'за период'
        }
    };

    const BILLING_PACKAGES = [
        {
            id: 'standard',
            names: { AZ: 'Standart', ENG: 'Standard', RUS: 'Standart' },
            icon: 'fa-layer-group',
            descriptionKey: 'standardDescription',
            featureKeys: ['standardFeature1', 'standardFeature2', 'standardFeature3'],
            prices: { 30: 0, 90: 0 }
        },
        {
            id: 'vip',
            names: { AZ: 'VIP', ENG: 'VIP', RUS: 'VIP' },
            icon: 'fa-crown',
            descriptionKey: 'vipDescription',
            featureKeys: ['vipFeature1', 'vipFeature2', 'vipFeature3'],
            prices: { 30: 12, 90: 30 },
            featuredLabelKey: 'featuredPopular'
        },
        {
            id: 'pro',
            names: { AZ: 'PRO', ENG: 'PRO', RUS: 'PRO' },
            icon: 'fa-bolt',
            descriptionKey: 'proDescription',
            featureKeys: ['proFeature1', 'proFeature2', 'proFeature3'],
            prices: { 30: 24, 90: 60 },
            featuredLabelKey: 'featuredMax'
        }
    ];

    const BILLING_METHODS = [
        { id: 'wallet', icon: 'fa-wallet', nameKey: 'methodWallet', descriptionKey: 'methodWalletDesc', chipKey: 'fastest' },
        { id: 'card', icon: 'fa-credit-card', nameKey: 'methodCard', descriptionKey: 'methodCardDesc', chipKey: 'secure' },
        { id: 'transfer', icon: 'fa-building-columns', nameKey: 'methodTransfer', descriptionKey: 'methodTransferDesc', chipKey: 'pendingLabel' }
    ];

    const BILLING_HISTORY_PREFIX = 'mobilaz_billing_history_';
    const billingState = {
        packageId: 'vip',
        duration: 30,
        method: 'wallet',
        initialized: false
    };

    function billingText(key, fallback = '') {
        const lang = getCurrentLang();
        return BILLING_COPY[lang]?.[key] || BILLING_COPY.AZ?.[key] || fallback;
    }

    function getBillingPackage(packageId) {
        return BILLING_PACKAGES.find((pkg) => pkg.id === packageId) || BILLING_PACKAGES[0];
    }

    function getBillingMethod(methodId) {
        return BILLING_METHODS.find((method) => method.id === methodId) || BILLING_METHODS[0];
    }

    function resolveCurrentPackageId(user) {
        const activePackage = String(user?.activePackage || '').toLowerCase();
        if (activePackage === 'vip' || activePackage === 'pro') {
            return activePackage;
        }

        return 'standard';
    }

    function getBillingPackageName(packageId) {
        const lang = getCurrentLang();
        const pkg = getBillingPackage(packageId);
        return pkg.names?.[lang] || pkg.names?.AZ || packageId;
    }

    function getBillingPrice(packageId = billingState.packageId, duration = billingState.duration) {
        return Number(getBillingPackage(packageId).prices?.[duration] || 0);
    }

    function isBillingPurchasable(packageId = billingState.packageId) {
        return packageId !== 'standard';
    }

    function getBillingHistoryKey(user) {
        return `${BILLING_HISTORY_PREFIX}${user?.email || user?.phone || 'guest'}`;
    }

    function getBillingHistory(user) {
        const raw = localStorage.getItem(getBillingHistoryKey(user));
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveBillingHistory(user, history) {
        localStorage.setItem(getBillingHistoryKey(user), JSON.stringify(history.slice(0, 8)));
    }

    function appendBillingHistory(user, entry) {
        const history = getBillingHistory(user);
        history.unshift(entry);
        saveBillingHistory(user, history);
    }

    function formatCurrency(amount) {
        return `${Number(amount || 0).toLocaleString(getLocale(), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} AZN`;
    }

    function getBillingCurrentNote(packageId) {
        if (packageId === 'vip') return billingText('currentPackageNoteVip', 'VIP paket elanlarınıza daha çox diqqət gətirir.');
        if (packageId === 'pro') return billingText('currentPackageNotePro', 'PRO paket maksimum görünürlük və prioritet yerləşdirmə verir.');
        return billingText('currentPackageNoteStandard', 'Hazırda standart hesabdan istifadə edirsiniz. Daha çox görünürlük üçün paket seçin.');
    }

    function getBillingActiveDuration(user) {
        const currentPackageId = resolveCurrentPackageId(user);
        if (currentPackageId === 'standard' || !user?.billingExpiresAt) {
            return billingText('activeDurationNone', 'Inactive');
        }

        const expiresAt = new Date(user.billingExpiresAt);
        if (Number.isNaN(expiresAt.getTime())) {
            return billingText('activeDurationNone', 'Inactive');
        }

        const remainingDays = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        if (remainingDays <= 0) {
            return billingText('activeDurationNone', 'Inactive');
        }

        return billingText('daysRemaining', '{{count}} days left').replace('{{count}}', String(remainingDays));
    }

    function getBillingNextPayment(user) {
        if (!user?.billingExpiresAt) {
            return billingText('nextPaymentNone', 'Planlasdirilmayib');
        }

        return formatDate(user.billingExpiresAt);
    }

    function syncBillingText() {
        document.querySelectorAll('[data-billing-i18n]').forEach((node) => {
            const key = node.getAttribute('data-billing-i18n');
            if (!key) return;
            node.textContent = billingText(key, node.textContent.trim());
        });
    }

    function renderBillingCurrentCard(user) {
        const currentPackageId = resolveCurrentPackageId(user);
        const currentPackageName = document.getElementById('billingCurrentPackageName');
        const currentBalance = document.getElementById('billingCurrentBalance') || document.getElementById('billingWalletBalance');

        if (currentPackageName) currentPackageName.textContent = getBillingPackageName(currentPackageId);
        if (currentBalance) currentBalance.textContent = formatCurrency(user?.walletBalance || 0);
    }

    function renderBillingPackages(user) {
        const packageGrid = document.getElementById('billingPackagesRow') || document.getElementById('billingPackageGrid');
        if (!packageGrid) return;

        const currentPackageId = resolveCurrentPackageId(user);
        packageGrid.innerHTML = BILLING_PACKAGES.map((pkg) => {
            const price = getBillingPrice(pkg.id, billingState.duration);
            const isSelected = billingState.packageId === pkg.id;
            const isPopular = pkg.id === 'vip';
            const isCurrent = currentPackageId === pkg.id;

            let badgeHtml = '';
            if (isCurrent) {
                badgeHtml = `<span class="badge" style="background:#64748b;">${escapeHtml(billingText('currentPlan', 'Cari plan'))}</span>`;
            } else if (isSelected) {
                badgeHtml = `<span class="badge" style="background:#10b981;">✓ ${escapeHtml(billingText('selectedNow', 'Seçildi'))}</span>`;
            } else if (isPopular) {
                badgeHtml = `<span class="badge">${escapeHtml(billingText('featuredPopular', 'Populyar'))}</span>`;
            }

            const buttonLabel = isSelected
                ? `✓ ${escapeHtml(billingText('selectedNow', 'Seçildi'))}`
                : escapeHtml(billingText('selectNow', 'Seç'));

            const durationText = escapeHtml(billingText(`duration${billingState.duration}`, `${billingState.duration} gün`));

            const features = pkg.featureKeys.map((key) => `
                <li><span class="check">✓</span><span class="feature-text">${escapeHtml(billingText(key, key))}</span></li>
            `).join('');

            return `
                <article class="pkg-card ${isSelected ? 'selected' : ''}" data-package="${pkg.id}" data-package-id="${pkg.id}" role="button" tabindex="0">
                    ${badgeHtml}
                    <div class="pkg-name">${escapeHtml(getBillingPackageName(pkg.id))}</div>
                    <div class="price"><b>${escapeHtml(String(price))}</b> <i>AZN / ${price === 0 ? 'həmişə' : durationText}</i></div>
                    <ul>${features}</ul>
                    <button type="button" class="select-btn">${buttonLabel}</button>
                </article>
            `;
        }).join('');
    }

    function renderBillingMethods(user) {
        const methodGrid = document.getElementById('billingMethodsRow') || document.getElementById('billingMethodGrid');
        if (!methodGrid) return;

        const walletBalance = Number(user?.walletBalance || 0);

        methodGrid.innerHTML = BILLING_METHODS.map((method) => {
            const isSelected = billingState.method === method.id;
            let hint = '';
            if (method.id === 'wallet') {
                hint = `Balans: ${formatCurrency(walletBalance)}`;
            } else if (method.id === 'card') {
                hint = 'Visa / Mastercard';
            } else if (method.id === 'transfer') {
                hint = 'Qaimə / Köçürmə';
            }

            return `
                <button type="button" class="pay-tab ${isSelected ? 'active' : ''}" data-method="${method.id}" data-method-id="${method.id}">
                    <div class="pay-tab-title">${escapeHtml(billingText(method.nameKey, method.id))}</div>
                    <div class="sub">${escapeHtml(hint)}</div>
                </button>
            `;
        }).join('');

        const payDesc = document.getElementById('billingMethodDesc') || document.getElementById('billingPayDesc');
        if (payDesc) {
            if (billingState.method === 'wallet') {
                payDesc.textContent = billingText('methodWalletDesc', 'Balans kifayət edirsə, paket dərhal aktivləşir.');
            } else if (billingState.method === 'card') {
                payDesc.textContent = billingText('methodCardDesc', 'Visa və Mastercard ilə onlayn ödəniş edin. 3D Secure ilə qorunur.');
            } else if (billingState.method === 'transfer') {
                payDesc.textContent = billingText('methodTransferDesc', 'Hüquqi şəxslər üçün qaimə və bank köçürməsi.');
            }
        }
    }

    function renderBillingSummary(user = getStoredUser()) {
        const selectedPackage = getBillingPackage(billingState.packageId);
        const selectedMethod = getBillingMethod(billingState.method);
        const total = getBillingPrice();
        const canPurchase = isBillingPurchasable(selectedPackage.id);

        const summaryPackage = document.getElementById('summaryPackage') || document.getElementById('billingSummaryPackage');
        const summaryDuration = document.getElementById('summaryDuration') || document.getElementById('billingSummaryDuration');
        const summaryMethod = document.getElementById('summaryMethod') || document.getElementById('billingSummaryMethod');
        const summaryTotal = document.getElementById('summaryTotal') || document.getElementById('billingSummaryTotal');
        const confirmBtn = document.getElementById('billingConfirmBtn');
        const walletBtn = document.getElementById('billingGoWalletBtn');
        const walletBalance = Number(user?.walletBalance || 0);

        if (summaryPackage) summaryPackage.textContent = getBillingPackageName(selectedPackage.id);
        if (summaryDuration) summaryDuration.textContent = canPurchase
            ? billingText(`duration${billingState.duration}`, `${billingState.duration} gün`)
            : billingText('includedPlan', 'Daxildir');
        if (summaryMethod) summaryMethod.textContent = canPurchase
            ? billingText(selectedMethod.nameKey, selectedMethod.id)
            : billingText('includedPlan', 'Daxildir');
        if (summaryTotal) summaryTotal.textContent = formatCurrency(total);

        if (confirmBtn) {
            confirmBtn.disabled = !canPurchase;
            confirmBtn.classList.toggle('is-disabled', !canPurchase);
            confirmBtn.textContent = canPurchase
                ? billingText('confirmPurchase', 'Paketi aktivləşdir')
                : billingText('noPaymentRequired', 'Ödəniş tələb olunmur');
        }

        if (walletBtn) {
            walletBtn.hidden = !canPurchase || billingState.method !== 'wallet' || walletBalance >= total;
            if (!walletBtn.hidden) {
                const diff = (total - walletBalance).toFixed(2);
                walletBtn.textContent = `Balans çatışmır (${diff} AZN) — Artır`;
            }
        }
    }

    function renderBillingHistory(user) {
        const historyList = document.getElementById('billingHistoryList');
        if (!historyList) return;

        const history = getBillingHistory(user);
        if (!history.length) {
            historyList.innerHTML = `
                <div class="billing-history-empty">
                    <i class="fas fa-receipt"></i>
                    <span>${escapeHtml(billingText('historyEmpty', 'No payment activity yet.'))}</span>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map((item) => {
            const isPaid = item.status === 'paid';
            const method = getBillingMethod(item.method);
            const packageName = getBillingPackageName(item.packageId || 'standard');
            const title = `${packageName} ${billingText('historyPackage', 'package')}`;
            const subtitle = `${formatDate(item.date)} - ${billingText('historyMethod', 'Method')}: ${billingText(method.nameKey, method.id)}`;

            return `
                <div class="billing-history-item">
                    <div class="billing-history-main">
                        <i class="fas ${method.icon}"></i>
                        <div>
                            <strong>${escapeHtml(title)}</strong>
                            <span>${escapeHtml(subtitle)}</span>
                        </div>
                    </div>
                    <div class="billing-history-amount">
                        <strong>${escapeHtml(formatCurrency(item.amount || 0))}</strong>
                        <small>${escapeHtml(isPaid ? billingText('historyPaid', 'Paid') : billingText('historyPending', 'Pending'))}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderBillingPanel(user = getStoredUser()) {
        const panel = document.getElementById('panel-billing');
        if (!panel) return;

        syncBillingText();

        const billingHeading = panel.querySelector('.billing-panel-head h3');
        if (billingHeading) billingHeading.textContent = billingText('billingHeading', 'Paketlər və ödənişlər');

        const currentPackageId = resolveCurrentPackageId(user);
        if (!billingState.initialized) {
            billingState.packageId = currentPackageId === 'standard' ? 'vip' : currentPackageId;
            billingState.initialized = true;
        }

        if (!getBillingPackage(billingState.packageId)) {
            billingState.packageId = 'vip';
        }

        renderBillingCurrentCard(user || {});
        renderBillingPackages(user || {});
        renderBillingMethods(user || {});
        renderBillingSummary(user || {});
        renderBillingHistory(user || {});

        document.querySelectorAll('.billing-duration-btn, .dur-btn').forEach((button) => {
            button.classList.toggle('active', Number(button.dataset.duration) === billingState.duration);
        });
    }

    async function openBillingPanel() {
        const tabs = document.querySelectorAll('.tab-link:not(.logout-link)');
        const contents = document.querySelectorAll('.cabinet-tab');
        const settingsTabLink = document.querySelector('.tab-link[data-target="tab-settings"]');
        const settingsPanelButton = document.querySelector('.settings-nav button[onclick*="panel-billing"]');
        const settingsTab = document.getElementById('tab-settings');

        tabs.forEach((tab) => tab.classList.remove('active'));
        contents.forEach((content) => {
            content.style.display = 'none';
            content.classList.remove('active');
        });

        if (settingsTabLink) settingsTabLink.classList.add('active');
        if (settingsTab) {
            settingsTab.style.display = 'block';
            settingsTab.classList.add('active');
        }

        if (window.showSettingsPanel && settingsPanelButton) {
            window.showSettingsPanel('panel-billing', settingsPanelButton);
        }

        // Load real prices from backend before rendering
        try {
            const token = getToken();
            if (token) {
                const resp = await fetch(`${API_BASE}/wallet/packages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resp.ok) {
                    const { packages: serverPkgs } = await resp.json();
                    if (Array.isArray(serverPkgs)) {
                        serverPkgs.forEach((sp) => {
                            const pkgId = sp.code?.toLowerCase(); // 'VIP' -> 'vip', 'PRO' -> 'pro'
                            const days = sp.durationDays;
                            const price = sp.price;
                            const localPkg = BILLING_PACKAGES.find((p) => p.id === pkgId);
                            if (localPkg && days && price !== undefined) {
                                localPkg.prices[days] = price;
                            }
                        });
                    }
                }
            }
        } catch (e) {
            // Silently fall back to hardcoded prices
        }

        renderBillingPanel(getStoredUser());
    }

    function bindBillingPanel() {
        const panel = document.getElementById('panel-billing') || document.getElementById('billing-panel');
        if (!panel || panel.dataset.bound === 'true') return;

        panel.dataset.bound = 'true';
        panel.addEventListener('click', (event) => {
            const durationButton = event.target.closest('.billing-duration-btn, .dur-btn');
            if (durationButton) {
                billingState.duration = Number(durationButton.dataset.duration) || 30;
                renderBillingPanel(getStoredUser());
                return;
            }

            const packageOption = event.target.closest('[data-package-id], [data-package], .pkg-card');
            if (packageOption) {
                billingState.packageId = packageOption.getAttribute('data-package-id') || packageOption.getAttribute('data-package') || 'vip';
                renderBillingPanel(getStoredUser());
                return;
            }

            const methodOption = event.target.closest('[data-method-id], [data-method], .pay-tab');
            if (methodOption) {
                if (!isBillingPurchasable()) return;
                billingState.method = methodOption.getAttribute('data-method-id') || methodOption.getAttribute('data-method') || 'wallet';
                renderBillingPanel(getStoredUser());
            }
        });

        panel.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            const interactiveCard = event.target.closest('[data-package-id], [data-package], [data-method-id], [data-method]');
            if (!interactiveCard) return;

            event.preventDefault();
            interactiveCard.click();
        });

        const topUpHandler = () => {
            toast.show(t('walletRedirect', 'Cüzdana keçirilir...'), 'info');
            // Navigate to wallet tab in settings
            const walletTabBtn = document.querySelector('.settings-nav button[onclick*="panel-wallet"]');
            if (walletTabBtn && window.showSettingsPanel) {
                const settingsTabLink = document.querySelector('.tab-link[data-target="tab-settings"]');
                const settingsTab = document.getElementById('tab-settings');
                document.querySelectorAll('.tab-link:not(.logout-link)').forEach((t) => t.classList.remove('active'));
                document.querySelectorAll('.cabinet-tab').forEach((c) => { c.style.display = 'none'; c.classList.remove('active'); });
                if (settingsTabLink) settingsTabLink.classList.add('active');
                if (settingsTab) { settingsTab.style.display = 'block'; settingsTab.classList.add('active'); }
                window.showSettingsPanel('panel-wallet', walletTabBtn);
            }
        };

        document.getElementById('billingTopUpBtn')?.addEventListener('click', topUpHandler);
        document.getElementById('billingTopUpQuickBtn')?.addEventListener('click', topUpHandler);
        document.getElementById('billingGoWalletBtn')?.addEventListener('click', topUpHandler);

        document.getElementById('billingConfirmBtn')?.addEventListener('click', async () => {
            const user = getStoredUser() || {};
            const price = getBillingPrice();
            const methodId = billingState.method;

            if (!isBillingPurchasable()) {
                return;
            }

            // Map billing package id + duration to productId expected by backend
            // BILLING_PACKAGES uses ids: 'vip', 'pro'  → productIds: 'vip-30', 'vip-90', 'pro-30', 'pro-90'
            const productId = `${billingState.packageId}-${billingState.duration}`;

            const token = getToken();
            if (!token) {
                toast.show(billingText('insufficientBalance', 'Zəhmət olmasa hesabınıza daxil olun.'), 'warning');
                return;
            }

            if (methodId === 'wallet') {
                const walletBalance = Number(user.walletBalance || 0);
                if (walletBalance < price) {
                    toast.show(billingText('insufficientBalance', 'Not enough balance. Top up first.'), 'warning');
                    return;
                }

                const confirmBtn = document.getElementById('billingConfirmBtn');
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.classList.add('is-disabled');
                }

                try {
                    // Fetch CSRF token
                    let csrfToken = window.CSRF_TOKEN || localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken') || '';
                    let signedCsrf = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || sessionStorage.getItem('csrfSignedToken') || '';
                    if (!csrfToken && typeof window.fetchCsrfToken === 'function') {
                        try { csrfToken = await window.fetchCsrfToken(); signedCsrf = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || ''; } catch (e) { /* ignore */ }
                    }

                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    };
                    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
                    if (signedCsrf) headers['X-CSRF-Signed-Token'] = signedCsrf;

                    const idempotencyKey = `billing-${billingState.packageId}-${billingState.duration}-${Date.now()}`;
                    const response = await fetch(`${API_BASE}/wallet/packages/purchase`, {
                        method: 'POST',
                        credentials: 'include',
                        headers,
                        body: JSON.stringify({ productId, idempotencyKey })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        let errMsg = data.message || billingText('insufficientBalance', 'Ödəniş uğursuz oldu');
                        if (data.required !== undefined && data.current !== undefined) {
                            errMsg = `Balans kifayət deyil. Lazım: ${data.required} AZN, Balansınız: ${data.current} AZN`;
                        }
                        throw new Error(errMsg);
                    }

                    // Update local user state with server response
                    const nextExpiry = data.packageExpiresAt || data.billingExpiresAt;
                    const updatedUser = {
                        ...user,
                        walletBalance: data.walletBalance !== undefined ? data.walletBalance : user.walletBalance,
                        activePackage: data.activePackage || (billingState.packageId === 'standard' ? null : billingState.packageId.toUpperCase()),
                        billingExpiresAt: nextExpiry || null,
                        packageExpiresAt: nextExpiry || null
                    };

                    persistUser(updatedUser);
                    appendBillingHistory(updatedUser, {
                        packageId: billingState.packageId,
                        duration: billingState.duration,
                        amount: price,
                        method: methodId,
                        status: 'paid',
                        date: new Date().toISOString()
                    });

                    renderCurrentUser(updatedUser);
                    toast.show(billingText('purchaseSuccess', 'Package activated successfully.'), 'success');

                    // Reset initialized so panel re-opens with new activePackage selected
                    billingState.initialized = false;

                    // Re-load ads so VIP badge appears immediately
                    if (typeof loadMyAds === 'function') loadMyAds();

                } catch (err) {
                    toast.show(err.message || billingText('insufficientBalance', 'Ödəniş zamanı xəta baş verdi'), 'error');
                } finally {
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.classList.remove('is-disabled');
                    }
                    renderBillingPanel(getStoredUser());
                }
                return;
            }

            // card / transfer: create a payment session on backend
            const confirmBtn = document.getElementById('billingConfirmBtn');
            if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.classList.add('is-disabled'); }

            try {
                let csrfToken = window.CSRF_TOKEN || localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken') || '';
                let signedCsrf = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || sessionStorage.getItem('csrfSignedToken') || '';
                if (!csrfToken && typeof window.fetchCsrfToken === 'function') {
                    try { csrfToken = await window.fetchCsrfToken(); signedCsrf = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || ''; } catch (e) { /* ignore */ }
                }
                const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
                if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
                if (signedCsrf) headers['X-CSRF-Signed-Token'] = signedCsrf;

                const idempotencyKey = `billing-${billingState.packageId}-${billingState.duration}-${Date.now()}`;
                const response = await fetch(`${API_BASE}/wallet/packages/payment-session`, {
                    method: 'POST',
                    credentials: 'include',
                    headers,
                    body: JSON.stringify({ productId, provider: methodId, idempotencyKey })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Sessiya yaradıla bilmədi');

                appendBillingHistory(user, {
                    packageId: billingState.packageId,
                    duration: billingState.duration,
                    amount: price,
                    method: methodId,
                    status: 'pending',
                    date: new Date().toISOString()
                });
                renderBillingHistory(getStoredUser());
                toast.show(
                    methodId === 'card'
                        ? billingText('redirectCard', 'Redirecting to card payment.')
                        : billingText('redirectTransfer', 'Opening invoice and transfer instructions.'),
                    'info'
                );
            } catch (err) {
                toast.show(err.message || 'Ödəniş sessiyası yaradıla bilmədi', 'error');
            } finally {
                if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.classList.remove('is-disabled'); }
            }
        });
    }

    window.openBillingPanel = openBillingPanel;

    function getStoredUser() {
        const raw =
            localStorage.getItem('user') ||
            localStorage.getItem('mobilaz_current_user') ||
            localStorage.getItem('adminUser');

        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function getDisplayName(user) {
        return [user?.name, user?.lastName].filter(Boolean).join(' ') || user?.email || t('userFallback', 'İstifadəçi');
    }

    function persistUser(user) {
        if (!user) return;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('mobilaz_current_user', JSON.stringify(user));

        if (user.role === 'admin') {
            const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('token');
            if (token) {
                sessionStorage.setItem('adminToken', token);
            }
            localStorage.setItem('adminUser', JSON.stringify(user));
        }
    }

    function getRoleLabel(user) {
        if (user?.role === 'admin') return t('roleAdmin', 'Admin Hesab');
        if (user?.activePackage === 'VIP') return t('roleVip', 'VIP Hesab');
        if (user?.activePackage === 'PRO') return t('rolePro', 'PRO Hesab');
        return t('roleStandard', 'Standart Hesab');
    }

    function ensureAdminShortcut(isAdmin) {
        const adminPanelNav = document.getElementById('adminPanelNav');
        if (adminPanelNav) {
            adminPanelNav.hidden = !isAdmin;
            const adminSwitchLabel = adminPanelNav.querySelector('.menu-left span:last-child');
            if (adminSwitchLabel) {
                adminSwitchLabel.textContent = t('adminSwitch', 'Adminliyə keç');
            }
        }

        if (!isAdmin) {
            return;
        }

        const header = document.querySelector('#tab-profile .cabinet-header');
        if (!header || header.querySelector('#adminPanelButton')) {
            return;
        }

        const newAdButton = header.querySelector('a[href="elan-yerlesdir.html"]');
        const adminButton = document.createElement('a');
        adminButton.id = 'adminPanelButton';
        adminButton.href = 'admin.html';
        adminButton.className = 'btn-primary';
        adminButton.textContent = t('adminPanel', 'Admin paneli');

        if (newAdButton) {
            let actionsWrap = newAdButton.parentElement;
            if (!actionsWrap.classList.contains('cabinet-header-actions')) {
                actionsWrap = document.createElement('div');
                actionsWrap.className = 'cabinet-header-actions';
                header.insertBefore(actionsWrap, newAdButton);
                actionsWrap.appendChild(newAdButton);
            }

            actionsWrap.insertBefore(adminButton, newAdButton);
        } else {
            header.appendChild(adminButton);
        }
    }

    function renderCurrentUser(user) {
        if (!user) return;

        const displayName = getDisplayName(user);
        const firstName = user.name || t('userFallback', 'istifadəçi');

        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        const sidebarUserRole = document.getElementById('sidebarUserRole');
        const welcomeText = document.querySelector('#tab-profile .cabinet-header p');
        const walletAmountValue = document.getElementById('walletAmountValue');
        const referralBalanceValue = document.getElementById('referralBalanceValue');
        const referralLink = document.getElementById('referralLink');
        const facebookProfileName = document.querySelector('.social-connect-card.connected .social-info span');

        if (sidebarUserName) sidebarUserName.textContent = displayName;
        if (sidebarUserEmail) sidebarUserEmail.textContent = user.email || user.phone || '—';
        if (sidebarUserRole) sidebarUserRole.textContent = getRoleLabel(user);
        if (welcomeText) {
            welcomeText.textContent = t('dashboardWelcome', 'Xoş gəldiniz, {{name}}. Bugünkü statistikanızla tanış olun.').replace('{{name}}', firstName);
        }
        if (walletAmountValue) {
            walletAmountValue.textContent = Number(user.walletBalance || 0).toLocaleString(getLocale(), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (referralBalanceValue) {
            referralBalanceValue.textContent = Number(user.referralCredits || 0).toLocaleString(getLocale(), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        userReferralBalance = Number(user.referralCredits || 0);
        if (referralLink) {
            referralLink.value = user.referralCode
                ? `https://mobil.az/ref/${user.referralCode}`
                : 'https://mobil.az/ref/...';
        }
        if (facebookProfileName) facebookProfileName.textContent = displayName;

        const profileFirstName = document.getElementById('profileFirstName');
        const profileLastName = document.getElementById('profileLastName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        const twoFactorCheckbox = document.getElementById('two_fa');
        const privacyShowPhone = document.getElementById('privacyShowPhone');
        const privacyAllowMessages = document.getElementById('privacyAllowMessages');
        const privacyShowOnline = document.getElementById('privacyShowOnline');

        if (profileFirstName) profileFirstName.value = user.name || '';
        if (profileLastName) profileLastName.value = user.lastName || '';
        if (profileEmail) profileEmail.value = user.email || '';
        if (profilePhone) profilePhone.value = user.phone || '';
        if (twoFactorCheckbox) twoFactorCheckbox.checked = Boolean(user.twoFactorEnabled);
        if (privacyShowPhone) privacyShowPhone.checked = user.privacySettings?.showPhone ?? true;
        if (privacyAllowMessages) privacyAllowMessages.checked = user.privacySettings?.allowMessages ?? true;
        if (privacyShowOnline) privacyShowOnline.checked = user.privacySettings?.showOnlineStatus ?? true;

        ensureAdminShortcut(user.role === 'admin');
        renderBillingPanel(user);

        if (window.updateNavbar) {
            window.updateNavbar(user);
        }
    }

    async function fetchReferralStats() {
        const token = getToken();
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE}/referral/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const referralCountEl = document.getElementById('referralCount');
                if (referralCountEl) {
                    referralCountEl.textContent = data.totalReferrals;
                }
            }
        } catch (error) {
            console.warn('Failed to fetch referral stats:', error);
        }
    }

    async function hydrateCurrentUser() {
        const token = getToken();
        const storedUser = getStoredUser();

        if (storedUser) {
            renderCurrentUser(storedUser);
        }

        if (!token) {
            return;
        }

        let isCabinetRedirecting = false;
        async function handleCabinet401(res) {
            if (isCabinetRedirecting || window.location.href.includes('login.html')) return;
            isCabinetRedirecting = true;
            const last401 = sessionStorage.getItem('last401Time');
            const now = Date.now();
            if (last401 && (now - parseInt(last401, 10)) < 5000) {
                console.warn('401 loop detected, clearing all tokens');
                ['token','accessToken','authToken','adminToken','jwt','user','mobilaz_current_user','adminUser'].forEach(k => {
                    try { localStorage.removeItem(k); } catch(e){}
                    try { sessionStorage.removeItem(k); } catch(e){}
                });
                sessionStorage.removeItem('last401Time');
                window.location.href = 'login.html?reason=loop_break';
                return;
            }
            sessionStorage.setItem('last401Time', now.toString());

            const curToken = window.getToken ? window.getToken() : (localStorage.getItem('token') || sessionStorage.getItem('token'));
            try {
                const me = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${curToken}` } });
                if (me.status === 401) {
                    ['token','accessToken','authToken','adminToken','jwt','user','mobilaz_current_user','adminUser'].forEach(k => {
                        try { localStorage.removeItem(k); } catch(e){}
                        try { sessionStorage.removeItem(k); } catch(e){}
                    });
                    window.location.href = 'login.html?expired=1';
                    return;
                }
            } catch(e) {}
            isCabinetRedirecting = false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                await handleCabinet401(response);
                return;
            }

            if (!response.ok) {
                return;
            }

            const user = await response.json();
            persistUser(user);
            renderCurrentUser(user);
        } catch (error) {
            console.warn('Cabinet user hydrate failed:', error);
        }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(value) {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString(getLocale(), {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function getImageUrl(image) {
        if (!image) {
            return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800';
        }

        if (image.startsWith('http://') || image.startsWith('https://')) {
            return image;
        }

        return API_BASE.replace(/\/api\/?$/, '') + image;
    }

    function getUiStatus(status) {
        const s = (status || '').toLowerCase();
        if (s === 'active') return 'active';
        if (s === 'pending') return 'pending';
        return 'expired';
    }

    function getStatusBadge(status) {
        const s = (status || '').toLowerCase();
        const labels = {
            active: t('statusActive', 'Aktiv'),
            pending: t('statusPending', 'Yoxlanılır'),
            rejected: t('statusRejected', 'Rədd edildi'),
            archived: t('statusArchived', 'Arxivdə'),
            sold: t('statusSold', 'Satılıb'),
            Active: t('statusActive', 'Aktiv'),
            Pending: t('statusPending', 'Yoxlanılır'),
            Rejected: t('statusRejected', 'Rədd edildi'),
            Archived: t('statusArchived', 'Arxivdə'),
            Sold: t('statusSold', 'Satılıb')
        };

        return labels[s] || labels[status] || status;
    }

    function getMyAdsList() {
        return document.querySelector('.my-ads-list');
    }

    function updateFilterCounts(ads) {
        const counts = {
            all: ads.length,
            active: ads.filter((ad) => (ad.status || '').toLowerCase() === 'active').length,
            pending: ads.filter((ad) => (ad.status || '').toLowerCase() === 'pending').length,
            expired: ads.filter((ad) => !['active', 'pending'].includes((ad.status || '').toLowerCase())).length
        };

        document.querySelectorAll('.ad-filters .filter-pill').forEach((pill) => {
            const filter = pill.getAttribute('data-filter') || 'all';
            const label = pill.querySelector('span')?.outerHTML || pill.textContent || '';
            pill.innerHTML = `${label} (${counts[filter] || 0})`;
        });
    }

    function applyAdFilter(filterType) {
        document.querySelectorAll('.my-ad-item').forEach((ad) => {
            const status = ad.getAttribute('data-status');
            ad.style.display = filterType === 'all' || status === filterType ? 'flex' : 'none';
        });
    }

    function bindFilterPills() {
        const filterPills = document.querySelectorAll('.ad-filters .filter-pill');
        filterPills.forEach((pill) => {
            pill.addEventListener('click', () => {
                filterPills.forEach((p) => p.classList.remove('active'));
                pill.classList.add('active');
                applyAdFilter(pill.getAttribute('data-filter') || 'all');
            });
        });
    }

    function renderMyAds(ads) {
        const list = getMyAdsList();
        if (!list) return;

        if (!ads.length) {
            list.innerHTML = `
                <div class="cab-glass" style="padding:24px;text-align:center;color:var(--cab-text-secondary);">
                    ${escapeHtml(t('noAds', 'Hələ sizin elanınız yoxdur.'))}
                </div>
            `;
            return;
        }

        list.innerHTML = ads.map((ad) => `
            <div class="my-ad-item cab-glass" data-status="${getUiStatus(ad.status)}" data-id="${escapeHtml(ad._id)}">
                <span class="ad-status-badge">${escapeHtml(getStatusBadge(ad.status))}</span>
                <img src="${escapeHtml(getImageUrl(ad.images?.[0]))}" class="my-ad-img" alt="${escapeHtml(ad.brand)}">
                <div class="my-ad-details">
                    <h4>${escapeHtml(ad.brand)} ${escapeHtml(ad.modelName)}</h4>
                    <div class="ad-meta">
                        <span><i class="fas fa-eye"></i> ${ad.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${ad.favorites || 0}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${escapeHtml(formatDate(ad.createdAt))}</span>
                    </div>
                    <p class="ad-price">${Number(ad.price || 0).toLocaleString(getLocale())} AZN</p>
                </div>
                <div class="my-ad-controls">
                    <button class="btn-boost" data-id="${escapeHtml(ad._id)}">
                        <i class="fas fa-rocket"></i> <span>${escapeHtml(window.translations?.[getCurrentLang()]?.['mon-promote-ad'] || 'Tanıt')}</span>
                    </button>
                    <div class="my-ad-actions">
                        <button class="btn-action edit-action" data-id="${escapeHtml(ad._id)}"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete-action" data-id="${escapeHtml(ad._id)}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async function loadMyAds() {
        const token = getToken();
        const list = getMyAdsList();
        if (!list) return;

        if (!token) {
            list.innerHTML = `
                <div class="cab-glass" style="padding:40px 20px;text-align:center;color:var(--cab-text-secondary);">
                    <i class="fas fa-lock" style="font-size:36px;margin-bottom:12px;display:block;opacity:0.6;"></i>
                    <p style="margin-bottom:12px;">${escapeHtml(t('authRequired', 'Zəhmət olmasa hesabınıza daxil olun.'))}</p>
                    <a href="login.html" class="btn-primary" style="display:inline-block;padding:8px 20px;text-decoration:none;">Giriş</a>
                </div>
            `;
            return;
        }

        list.innerHTML = `
            <div class="cab-glass" style="padding:24px;text-align:center;color:var(--cab-text-secondary);">
                ${escapeHtml(t('loadingAds', 'Elanlar yüklənir...'))}
            </div>
        `;

        try {
            const response = await fetch(`${API_BASE}/ads/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                if (typeof handleCabinet401 === 'function') {
                    await handleCabinet401(response);
                } else {
                    window.location.href = 'login.html?expired=1';
                }
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Elanlar yüklənmədi');
            }

            const ads = Array.isArray(data.ads) ? data.ads : [];
            renderMyAds(ads);
            updateFilterCounts(ads);

            const activeFilter = document.querySelector('.ad-filters .filter-pill.active')?.getAttribute('data-filter') || 'all';
            applyAdFilter(activeFilter);
        } catch (error) {
            list.innerHTML = `
                <div class="cab-glass" style="padding:24px;text-align:center;color:var(--cab-danger);">
                    ${escapeHtml(error.message || t('adsLoadError', 'Elanlar yüklənmədi.'))}
                </div>
            `;
        }
    }

    async function deleteAd(adId) {
        const token = getToken();
        const response = await fetch(`${API_BASE}/ads/${adId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Elan silinmədi');
        }
    }

    function bindMyAdActions() {
        const list = getMyAdsList();
        if (!list) return;

        list.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-action');
            const editBtn = e.target.closest('.edit-action');
            const boostBtn = e.target.closest('.btn-boost');

            if (boostBtn) {
                const adId = boostBtn.getAttribute('data-id') || boostBtn.closest('.my-ad-item')?.getAttribute('data-id');
                window.openPromotionModal(adId);
                return;
            }

            if (editBtn) {
                const adId = editBtn.getAttribute('data-id') || editBtn.closest('.my-ad-item')?.getAttribute('data-id');
                if (adId) {
                    window.location.href = `elan-yerlesdir.html?edit=${encodeURIComponent(adId)}`;
                }
                return;
            }

            if (!deleteBtn) {
                return;
            }

            const adId = deleteBtn.getAttribute('data-id') || deleteBtn.closest('.my-ad-item')?.getAttribute('data-id');
            if (!adId) return;

            if (!confirm(t('deleteAdConfirm', 'Bu elanı silmək istədiyinizdən əminsiniz?'))) {
                return;
            }

            try {
                await deleteAd(adId);
                toast.show(t('adDeleted', 'Elan silindi.'), 'warning');
                await loadMyAds();
            } catch (error) {
                toast.show(error.message, 'error');
            }
        });
    }

    function bindStaticButtons() {
        // ── Wallet buttons ────────────────────────────────
        document.querySelectorAll('.btn-wallet').forEach((btn) => {
            btn.addEventListener('click', () => {
                const actionKey = btn.getAttribute('data-translate');
                if (actionKey === 'cab-increase') {
                    toast.show(t('walletRedirect', 'Ödəniş sisteminə yönləndirilir...'), 'info');
                    openBillingPanel();
                } else if (actionKey === 'cab-buy-package') {
                    openBillingPanel();
                }
            });
        });

        // ── Helper: API call with Bearer token ────────────────
        async function apiPut(endpoint, body) {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
            return data;
        }

        async function apiPost(endpoint, body = {}) {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
            return data;
        }

        async function apiDelete(endpoint) {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
            return data;
        }

        function setButtonLoading(btn, loading) {
            if (!btn) return false;
            if (loading) {
                if (btn.disabled) return false;
                btn.disabled = true;
                btn._originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                return true;
            } else {
                btn.disabled = false;
                btn.innerHTML = btn._originalText || btn.innerHTML;
                return true;
            }
        }

        // ── Save Personal Profile → PUT /api/user/profile ──────
        const btnSaveProfile = document.getElementById('btnSaveProfile');
        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', async () => {
                const name     = document.getElementById('profileFirstName')?.value.trim();
                const lastName = document.getElementById('profileLastName')?.value.trim();
                const email    = document.getElementById('profileEmail')?.value.trim();
                const phone    = document.getElementById('profilePhone')?.value.trim();

                if (!name) { toast.show(t('nameRequired', 'Ad boş ola bilməz.'), 'error'); return; }

                if (!setButtonLoading(btnSaveProfile, true)) return;
                try {
                    const updated = await apiPut('user/profile', { name, lastName, email, phone });
                    // Refresh localStorage so navbar updates immediately
                    const stored = JSON.parse(localStorage.getItem('user') || '{}');
                    const merged = { ...stored, ...updated };
                    persistUser(merged);
                    renderCurrentUser(merged);
                    toast.show(t('profileSaved', 'Profil məlumatları yadda saxlanıldı!'), 'success');
                } catch (err) {
                    toast.show(err.message, 'error');
                } finally {
                    setButtonLoading(btnSaveProfile, false);
                }
            });
        }

        // ── 2FA Toggle (Enroll / Disable) → POST /api/auth/2fa/* ─
        const twoFactorCheckbox = document.getElementById('two_fa');
        if (twoFactorCheckbox) {
            twoFactorCheckbox.addEventListener('change', async () => {
                const isChecking = twoFactorCheckbox.checked;
                const stored = getStoredUser() || {};
                const currentStatus = Boolean(stored.twoFactorEnabled);

                if (isChecking === currentStatus) return;

                if (isChecking) {
                    const currentPassword = window.prompt('2FA-nı aktiv etmək üçün cari şifrənizi daxil edin:');
                    if (!currentPassword) {
                        twoFactorCheckbox.checked = false;
                        return;
                    }

                    try {
                        const enrollData = await apiPost('auth/2fa/enroll', { currentPassword });
                        const secret = enrollData.secret;
                        const promptMsg = `${enrollData.message || 'Authenticator tətbiqinizə açarı əlavə edin:'}\n\nAçar: ${secret}\n\nAuthenticator-dan aldığınız 6 rəqəmli təsdiq kodunu daxil edin:`;
                        const code = window.prompt(promptMsg);

                        if (!code) {
                            twoFactorCheckbox.checked = false;
                            toast.show('2FA quraşdırması ləğv edildi', 'warning');
                            return;
                        }

                        const confirmData = await apiPost('auth/2fa/confirm', { code: code.trim() });
                        stored.twoFactorEnabled = true;
                        persistUser(stored);
                        twoFactorCheckbox.checked = true;
                        toast.show(confirmData.message || '2FA aktiv edildi!', 'success');

                        if (confirmData.recoveryCodes && confirmData.recoveryCodes.length) {
                            window.alert('Bərpa kodlarınız (təhlükəsiz yerdə saxlayın):\n\n' + confirmData.recoveryCodes.join('\n'));
                        }
                    } catch (err) {
                        twoFactorCheckbox.checked = false;
                        toast.show(err.message || '2FA aktivləşdirilə bilmədi', 'error');
                    }
                } else {
                    const currentPassword = window.prompt('2FA-nı söndürmək üçün cari şifrənizi daxil edin:');
                    if (!currentPassword) {
                        twoFactorCheckbox.checked = true;
                        return;
                    }

                    const otpCode = window.prompt('Authenticator-dan 6 rəqəmli təsdiq kodunu (və ya bərpa kodunu) daxil edin:');
                    if (!otpCode) {
                        twoFactorCheckbox.checked = true;
                        return;
                    }

                    try {
                        const disableData = await apiPost('auth/2fa/disable', {
                            currentPassword,
                            otpCode: otpCode.trim()
                        });
                        stored.twoFactorEnabled = false;
                        persistUser(stored);
                        twoFactorCheckbox.checked = false;
                        toast.show(disableData.message || '2FA söndürüldü', 'info');
                    } catch (err) {
                        twoFactorCheckbox.checked = true;
                        toast.show(err.message || '2FA söndürülə bilmədi', 'error');
                    }
                }
            });
        }

        // ── Save Password → PUT /api/user/security ────────────
        const btnSaveSecurity = document.getElementById('btnSaveSecurity');
        if (btnSaveSecurity) {
            btnSaveSecurity.addEventListener('click', async () => {
                const oldPassword = document.getElementById('secOldPassword')?.value;
                const newPassword = document.getElementById('secNewPassword')?.value;

                if (!oldPassword && !newPassword) {
                    return;
                }

                if (!oldPassword) {
                    toast.show(t('currentPasswordRequired', 'Cari şifrəni daxil edin.'), 'error');
                    return;
                }
                if (!newPassword || newPassword.length < 6) {
                    toast.show(t('passwordMin', 'Şifrə ən azı 6 simvol olmalıdır.'), 'error');
                    return;
                }

                const body = { oldPassword, newPassword };

                if (!setButtonLoading(btnSaveSecurity, true)) return;
                try {
                    await apiPut('user/security', body);
                    // Clear password fields after success
                    if (document.getElementById('secOldPassword')) document.getElementById('secOldPassword').value = '';
                    if (document.getElementById('secNewPassword')) document.getElementById('secNewPassword').value = '';
                    toast.show(t('securitySaved', 'Təhlükəsizlik tənzimləmələri yadda saxlanıldı!'), 'success');
                } catch (err) {
                    toast.show(err.message, 'error');
                } finally {
                    setButtonLoading(btnSaveSecurity, false);
                }
            });
        }

        // ── Save Privacy Toggles → PUT /api/user/privacy ───────
        const btnSavePrivacy = document.getElementById('btnSavePrivacy');
        if (btnSavePrivacy) {
            btnSavePrivacy.addEventListener('click', async () => {
                const body = {
                    showPhone:        document.getElementById('privacyShowPhone')?.checked        ?? true,
                    allowMessages:    document.getElementById('privacyAllowMessages')?.checked    ?? true,
                    showOnlineStatus: document.getElementById('privacyShowOnline')?.checked       ?? true
                };
                if (!setButtonLoading(btnSavePrivacy, true)) return;
                try {
                    await apiPut('user/privacy', body);
                    toast.show(t('privacySaved', 'Məxfilik tənzimləmələri yadda saxlanıldı!'), 'success');
                } catch (err) {
                    toast.show(err.message, 'error');
                } finally {
                    setButtonLoading(btnSavePrivacy, false);
                }
            });
        }

        // ── Freeze Account → POST /api/user/freeze ────────────
        const freezeBtn = document.querySelector('.btn-outline-warning');
        if (freezeBtn) {
            freezeBtn.addEventListener('click', async () => {
                if (!confirm(t('freezeConfirm', 'Hesabınızı dondurmaq istədiyinizdən əminsiniz? Bütün aktiv elanlarınız gizlədiləcək.'))) return;
                if (!setButtonLoading(freezeBtn, true)) return;
                try {
                    await apiPost('user/freeze');
                    toast.show(t('accountFrozen', 'Hesabınız donduruldu. Sistemdən çıxış edilir...'), 'warning', 2500);
                    setTimeout(() => {
                        ['token','user','mobilaz_current_user','adminToken','adminUser'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
                        window.location.href = 'login.html';
                    }, 2500);
                } catch (err) {
                    toast.show(err.message, 'error');
                    setButtonLoading(freezeBtn, false);
                }
            });
        }

        // ── Delete Account → DELETE /api/user/delete ─────────
        const deleteAccBtn = document.querySelector('.btn-outline-danger');
        if (deleteAccBtn) {
            deleteAccBtn.addEventListener('click', async () => {
                if (!confirm(t('deleteConfirmOne', 'XƏBƏRDARLIQ: Hesabınız və bütün məlumatlarınız həmişəlik silinəcək. Davam etmək istəyirsiniz?'))) return;
                if (!confirm(t('deleteConfirmTwo', 'Son təsdiq: Bu əməliyyat GERİ QAYTARILA BİLMƏZ. Silmək istəyirsiniz?'))) return;
                if (!setButtonLoading(deleteAccBtn, true)) return;
                try {
                    await apiDelete('user/delete');
                    toast.show(t('accountDeleted', 'Hesabınız silindi. Yönləndirilirsiniz...'), 'error', 2500);
                    setTimeout(() => {
                        ['token','user','mobilaz_current_user','adminToken','adminUser'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
                        window.location.href = 'index.html';
                    }, 2500);
                } catch (err) {
                    toast.show(err.message, 'error');
                    setButtonLoading(deleteAccBtn, false);
                }
            });
        }
    }

    let currentConversation = null;
    let cabinetSocket = null;
    let allCabinetConversations = [];

    function initCabinetSocket() {
        if (cabinetSocket) return cabinetSocket;
        const token = getToken();
        const storedUser = getStoredUser();
        const myId = storedUser ? (storedUser.id || storedUser._id) : '';
        
        if (typeof io !== 'function' || !token || !myId) return null;
        
        const socketUrl = (window.API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
        try {
            cabinetSocket = io(socketUrl, {
                auth: { token }
            });
            
            cabinetSocket.on('connect', () => {
                cabinetSocket.emit('join_chat', myId);
            });
            
            cabinetSocket.on('receive_message', (msg) => {
                handleCabinetIncomingMessage(msg, myId);
            });
        } catch (err) {
            console.error('Socket init error in cabinet:', err);
        }
        return cabinetSocket;
    }

    function handleCabinetIncomingMessage(msg, myId) {
        const msgSenderId = msg.sender?._id || msg.sender;
        const msgAdId = msg.ad?._id || msg.ad;
        const isMine = msgSenderId === myId;
        
        // If current open conversation matches this message, append it
        if (currentConversation) {
            const curAdId = currentConversation._id?.ad || currentConversation.lastMessage?.ad?._id || currentConversation.lastMessage?.ad;
            const curOtherId = currentConversation._id?.other;
            
            if (msgAdId === curAdId && (msgSenderId === curOtherId || isMine)) {
                appendCabinetMessage(msg, isMine);
            }
        }
        
        // Update or reload conversations list to reflect last message and unread count
        loadConversations({ preserveSelection: true });
    }

    function appendCabinetMessage(msg, isMine) {
        const messagesArea = document.querySelector('.chat-messages');
        if (!messagesArea) return;
        
        // Clear empty state illustration if present
        if (messagesArea.querySelector('.fa-comments') || messagesArea.querySelector('.fa-spinner')) {
            messagesArea.innerHTML = '';
        }
        
        const bubble = document.createElement('div');
        bubble.className = `bubble ${isMine ? 'bubble-sent' : 'bubble-received'}`;
        
        let timeStr = '';
        if (msg.createdAt) {
            const date = new Date(msg.createdAt);
            if (!Number.isNaN(date.getTime())) {
                timeStr = date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
            }
        }
        
        bubble.innerHTML = `
            <div>${escapeHtml(msg.text || '')}</div>
            ${timeStr ? `<span class="bubble-time">${escapeHtml(timeStr)}</span>` : ''}
        `;
        
        messagesArea.appendChild(bubble);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    async function openConversationInCabinet(conv) {
        currentConversation = conv;
        
        const ad = conv.lastMessage?.ad || {};
        const other = conv._id?.other;
        const otherUser = (conv.lastMessage?.sender?._id === other) ? conv.lastMessage?.sender : conv.lastMessage?.recipient;
        const otherName = otherUser ? (otherUser.name || otherUser.email || 'İstifadəçi') : 'İstifadəçi';
        const adTitle = ad.brand ? `${ad.brand} ${ad.modelName || ''}` : (conv.adTitle || 'Elan');
        
        // Update header info
        const headerName = document.querySelector('.chat-header-info h3');
        const headerAd = document.querySelector('.chat-header-info p');
        if (headerName) headerName.textContent = otherName;
        if (headerAd) headerAd.innerHTML = `<i class="fas fa-tag"></i> <span>${escapeHtml(adTitle)}</span>`;
        
        // Highlight active item in list
        document.querySelectorAll('.chat-list-item').forEach(el => {
            el.classList.remove('active');
            el.style.borderLeft = 'none';
        });
        const activeItem = document.querySelector(`.chat-list-item[data-ad-id="${conv._id?.ad}"][data-other-id="${other}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.style.borderLeft = '3px solid var(--airy-primary)';
            const unreadBadge = activeItem.querySelector('.unread-badge');
            if (unreadBadge) unreadBadge.remove();
        }
        
        // Load messages history
        const messagesArea = document.querySelector('.chat-messages');
        if (messagesArea) {
            messagesArea.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
        }
        
        const token = getToken();
        const storedUser = getStoredUser();
        const myId = storedUser ? (storedUser.id || storedUser._id) : '';
        const adId = conv._id?.ad;
        
        if (!adId || !other) return;
        
        try {
            const res = await fetch(`${API_BASE}/messages/${adId}?with=${other}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (messagesArea) {
                messagesArea.innerHTML = '';
                if (res.ok && Array.isArray(data.messages)) {
                    if (data.messages.length === 0) {
                        messagesArea.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.6;"><i class="fas fa-comments" style="font-size:48px; margin-bottom:10px;"></i><span>Hələ mesaj yoxdur. İlk mesajı siz yazın!</span></div>';
                    } else {
                        data.messages.forEach(m => {
                            const senderId = m.sender?._id || m.sender;
                            const isMine = senderId === myId;
                            appendCabinetMessage(m, isMine);
                        });
                    }
                } else {
                    messagesArea.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">Mesajlar yüklənmədi</div>';
                }
            }
        } catch (err) {
            console.error('Error loading thread:', err);
            if (messagesArea) {
                messagesArea.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">Tarixçə yüklənərkən xəta baş verdi</div>';
            }
        }
    }

    async function sendCabinetMessage() {
        const input = document.querySelector('.chat-input input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        
        if (!currentConversation) {
            toast.show(t('selectConversationFirst', 'Zəhmət olmasa əvvəlcə bir söhbət seçin'), 'warning');
            return;
        }
        
        const token = getToken();
        const storedUser = getStoredUser();
        const myId = storedUser ? (storedUser.id || storedUser._id) : '';
        const otherId = currentConversation._id?.other;
        const adId = currentConversation._id?.ad;
        
        if (!otherId || !adId) return;
        
        input.value = '';
        
        const socket = initCabinetSocket();
        let sentViaSocket = false;
        
        if (socket && socket.connected) {
            socket.emit('send_message', {
                sender: myId,
                recipient: otherId,
                ad: adId,
                text
            });
            sentViaSocket = true;
        } else {
            // HTTP fallback
            try {
                const res = await fetch(`${API_BASE}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        recipientId: otherId,
                        adId,
                        text
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    appendCabinetMessage(data, true);
                } else {
                    toast.show(data.message || 'Mesaj göndərilmədi', 'error');
                }
            } catch (err) {
                console.error('Failed to send message via HTTP:', err);
                toast.show('Mesaj göndərilmədi', 'error');
            }
        }
    }

    function setupCabinetChatEvents() {
        const sendBtn = document.querySelector('.chat-input .btn-send');
        const chatInput = document.querySelector('.chat-input input');
        const searchInput = document.querySelector('.chat-search input');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sendCabinetMessage();
            });
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendCabinetMessage();
                }
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                const items = document.querySelectorAll('.chat-list .chat-list-item');
                let visibleCount = 0;
                
                items.forEach(item => {
                    const text = (item.textContent || '').toLowerCase();
                    if (!query || text.includes(query)) {
                        item.style.display = 'block';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                const noResultMsg = document.getElementById('chat-search-no-result');
                if (visibleCount === 0 && query) {
                    if (!noResultMsg) {
                        const noRes = document.createElement('div');
                        noRes.id = 'chat-search-no-result';
                        noRes.style.cssText = 'padding: 20px; font-size: 13px; text-align: center; color: var(--text-muted);';
                        noRes.textContent = 'Axtarışa uyğun söhbət tapılmadı.';
                        document.querySelector('.chat-list')?.appendChild(noRes);
                    }
                } else if (noResultMsg) {
                    noResultMsg.remove();
                }
            });
        }
    }

    async function loadConversations(options = {}) {
        const chatList = document.querySelector('.chat-list');
        if (!chatList) return;
        
        if (!options.preserveSelection) {
            chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
        }
        
        try {
            const response = await fetch(`${API_BASE}/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Söhbətlər yüklənmədi');
            }
            
            const conversations = Array.isArray(data.conversations)
                ? data.conversations
                : [];
            allCabinetConversations = conversations;
            
            chatList.innerHTML = '';
            
            if (conversations.length === 0) {
                chatList.innerHTML = '<div class="empty-state" style="padding: 20px; font-size: 14px; text-align: center; color: var(--text-muted);"><span data-translate="cab-msg-empty">Mesaj qutunuz boşdur.</span></div>';
                return;
            }
            
            conversations.forEach(conv => {
                const ad = conv.lastMessage?.ad || {};
                const other = conv._id?.other;
                const otherUser = (conv.lastMessage?.sender?._id === other) ? conv.lastMessage?.sender : conv.lastMessage?.recipient;
                
                const otherName = otherUser ? (otherUser.name || otherUser.email || 'İstifadəçi') : 'İstifadəçi';
                const adTitle = ad.brand ? `${ad.brand} ${ad.modelName || ''}` : 'Elan';
                
                const item = document.createElement('div');
                item.className = 'chat-list-item cab-glass';
                item.setAttribute('data-ad-id', conv._id?.ad || '');
                item.setAttribute('data-other-id', other || '');
                item.style.padding = '15px';
                item.style.borderBottom = '1px solid var(--border-color)';
                item.style.cursor = 'pointer';
                item.style.transition = 'background 0.2s';
                
                const isSelected = currentConversation && (currentConversation._id?.ad === conv._id?.ad) && (currentConversation._id?.other === other);
                if (isSelected) {
                    item.classList.add('active');
                    item.style.borderLeft = '3px solid var(--airy-primary)';
                }
                
                item.onmouseover = () => { if (!item.classList.contains('active')) item.style.background = 'var(--bg-secondary)'; };
                item.onmouseout = () => { if (!item.classList.contains('active')) item.style.background = 'transparent'; };
                
                item.innerHTML = `
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <img src="${otherUser?.avatar || 'Photo/avatar.png'}" alt="${escapeHtml(otherName)} profil şəkli" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(otherName)}</div>
                            <div style="font-size: 12px; color: var(--airy-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${escapeHtml(adTitle)}</div>
                            <div style="font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(conv.lastMessage?.text || '')}</div>
                        </div>
                        ${conv.unread > 0 ? `<div class="unread-badge" style="background: var(--airy-primary); color: white; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px;">${conv.unread}</div>` : ''}
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    openConversationInCabinet(conv);
                });
                
                chatList.appendChild(item);
            });
            
            initCabinetSocket();
            
        } catch (error) {
            console.error('Error fetching conversations:', error);
            chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Xəta baş verdi</div>';
        }
    }

    bindFilterPills();
    bindMyAdActions();
    bindBillingPanel();
    bindStaticButtons();
    setupCabinetChatEvents();
    loadConversations();
    renderBillingPanel(getStoredUser() || {});
    hydrateCurrentUser();
    loadMyAds();

    document.addEventListener('mobilaz:languagechange', () => {
        const storedUser = getStoredUser();
        if (storedUser) {
            renderCurrentUser(storedUser);
        }
        renderBillingPanel(storedUser || {});
        loadMyAds();
        updateTotal();
    });
});

let currentPromoAdId = null;
let selectedPkg = 'Urgent';

const prices = {
    Urgent: 3.0,
    VIP: 5.0,
    Premium: 10.0
};

window.openPromotionModal = function (adId) {
    currentPromoAdId = adId;
    const modal = document.getElementById('promotionModal');
    if (modal) {
        modal.classList.add('active');
        selectPackage('Urgent');
    }
};

window.closePromotionModal = function () {
    const modal = document.getElementById('promotionModal');
    if (modal) modal.classList.remove('active');
};

window.selectPackage = function (pkg) {
    selectedPkg = pkg;

    document.querySelectorAll('.promo-pkg-card').forEach((card) => {
        const input = card.querySelector('input');
        if (input) input.checked = (input.value === pkg);
    });

    updateTotal();
};

window.updateTotal = function () {
    let price = prices[selectedPkg] || 0;
    const finalPriceElem = document.getElementById('finalPrice');
    if (finalPriceElem) finalPriceElem.innerText = price.toFixed(2) + ' AZN';
};

window.confirmPromotion = async function () {
    const t = window.toast || { show: (message, type) => alert(message) };
    if (!currentPromoAdId) {
        t.show('Xəta: Elan seçilməyib', 'error');
        return;
    }

    const token = typeof getAuthToken === 'function'
        ? getAuthToken()
        : (window.getAuthToken ? window.getAuthToken() : (typeof getToken === 'function' ? getToken() : (sessionStorage.getItem('token') || localStorage.getItem('token'))));
    if (!token) {
        t.show('Lütfən daxil olun', 'error');
        return;
    }

    const payBtn = document.getElementById('btnPayPromo');
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşlənir...';
    }

    try {
        const base = window.API_URL || window.API_BASE || (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:5000/api');

        // Retrieve CSRF token from memory or storage
        let csrfToken = window.CSRF_TOKEN || localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken') || '';
        let signedCsrf = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || sessionStorage.getItem('csrfSignedToken') || '';

        if (!csrfToken && typeof window.fetchCsrfToken === 'function') {
            try {
                csrfToken = await window.fetchCsrfToken();
                signedCsrf = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || '';
            } catch (e) {
                console.warn('CSRF token fetch warning:', e);
            }
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        if (signedCsrf) {
            headers['X-CSRF-Signed-Token'] = signedCsrf;
        }

        const response = await fetch(`${base}/ads/${encodeURIComponent(currentPromoAdId)}/boost`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({ promotionType: selectedPkg })
        });

        const data = await response.json();

        if (!response.ok) {
            let errMsg = data.message || 'Ödəniş uğursuz oldu';
            if (data.required !== undefined && data.current !== undefined) {
                errMsg = `Balans kifayət deyil. Lazım olan: ${data.required} AZN, Balansınız: ${data.current} AZN`;
            }
            throw new Error(errMsg);
        }

        t.show(data.message || `${selectedPkg} uğurla aktivləşdirildi!`, 'success');
        window.closePromotionModal();

        // Update stored user wallet balance
        if (data.walletBalance !== undefined) {
            const rawUser = localStorage.getItem('user') || localStorage.getItem('mobilaz_current_user');
            if (rawUser) {
                try {
                    const userObj = JSON.parse(rawUser);
                    userObj.walletBalance = data.walletBalance;
                    localStorage.setItem('user', JSON.stringify(userObj));
                    localStorage.setItem('mobilaz_current_user', JSON.stringify(userObj));
                } catch (e) {
                    console.error('Error updating stored user balance:', e);
                }
            }
        }

        // Re-hydrate user profile & reload my ads
        if (typeof hydrateCurrentUser === 'function') {
            hydrateCurrentUser();
        }
        if (typeof loadMyAds === 'function') {
            loadMyAds();
        }
    } catch (error) {
        t.show(error.message || 'Ödəniş zamanı xəta baş verdi', 'error');
    } finally {
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span data-translate="mon-pay-btn">Ödəniş et</span>';
        }
    }
};

window.copyReferralLink = function () {
    const linkInput = document.getElementById('referralLink');
    if (!linkInput) return;

    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(linkInput.value);

    const t = window.toast || { show: (message) => alert(message) };
    const translate = window.cabinetT || ((key, fallback) => fallback);
    t.show(translate('copySuccess', 'Referal linki kopyalandı!'), 'success');
};

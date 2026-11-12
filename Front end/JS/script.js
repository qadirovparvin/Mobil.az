"use strict";
document.addEventListener("DOMContentLoaded", function () {
    const translations = {
        AZ: {
            Contact: "Əlaqə",
            About: "Haqqımızda",
            Stores: "Mağazalar (tezliklə)",
            "vip-empty": "Hazırda VIP elan yoxdur.",
            "ads-empty": "Hazırda aktiv elan yoxdur.",
            "search-found": "{count} elan tapıldı",
            "searching": "Axtarılır...",
            "no-results": "Nəticə tapılmadı",
            "filter-title": "Filtrlər",
            "all-ads": "Bütün elanlar",
            "clear-filter": "Təmizlə",
            "clear-search": "Təmizlə",
            Favorite: "Seçilmişlər",
            "login-btn": "Giriş",
            "register-btn": "Qeydiyyat",
            "search-btn": "Axtar",
            "search-placeholder": "Telefon axtar...",
            "language-selector": "AZ",
            "catalog-button": "Kataloq",
            phone: "Telefonlar",
            tablet: "Planşetlər",
            headphone: "Qulaqcıqlar",
            "phone-accessories": "Telefon aksesuarları",
            "search-in-more-detail": "Daha ətraflı axtar",
            brand: "Marka",
            "all-brand": "Bütün markalar",
            other: "Digər",
            "select-brand": "Əvvəlcə marka seçin",
            "price-range": "Qiymət aralığı",
            city: "Şəhər",
            "all-city": "Bütün şəhərlər",
            Baku: "Bakı", Sumqayit: "Sumqayıt", Ganja: "Gəncə",
            Absheron: "Abşeron", Agcabedi: "Ağcabədi", Agdam: "Ağdam",
            Agdash: "Ağdaş", Agstafa: "Ağstafa", Agsu: "Ağsu",
            Astara: "Astara", Balakan: "Balakən", Beylagan: "Beyləqan",
            Barda: "Bərdə", Bilasuvar: "Biləsuvar", Dashkasan: "Daşkəsən",
            Fuzuli: "Füzuli", Gadabay: "Gədəbəy", Goranboy: "Goranboy",
            Goychay: "Göyçay", Goygol: "Göygöl", Hajigabul: "Hacıqabul",
            Imishli: "İmişli", Ismayilli: "İsmayıllı", Jabrayil: "Cəbrayıl",
            Jalilabad: "Cəlilabad", Kalbajar: "Kəlbəcər", Kurdamir: "Kürdəmir",
            Lachin: "Laçın", Lankaran: "Lənkəran", Lerik: "Lerik",
            Masalli: "Masallı", Mingachevir: "Mingəçevir", Naftalan: "Naftalan",
            Nakhchivan: "Naxçıvan", Neftchala: "Neftçala", Oguz: "Oğuz",
            Qabala: "Qəbələ", Qakh: "Qax", Qazakh: "Qazax", Quba: "Quba",
            Qubadli: "Qubadlı", Qusar: "Qusar", Saatli: "Saatlı",
            Sabirabad: "Sabirabad", Salyan: "Salyan", Shabran: "Şabran",
            Shaki: "Şəki", Shamakhi: "Şamaxı", Shirvan: "Şirvan",
            Shusha: "Şuşa", Siazan: "Siyəzən", Tartar: "Tərtər",
            Tovuz: "Tovuz", Ujar: "Ucar", Yardimli: "Yardımlı",
            Yevlakh: "Yevlax", Zangilan: "Zəngilan", Zaqatala: "Zaqatala",
            Zardab: "Zərdab",
            "filter-category-label": "Kateqoriya",
            "filter-cat-all": "Hamısı",
            "filter-cat-phone": "Telefonlar",
            "filter-cat-tablet": "Planşetlər",
            "filter-cat-headphone": "Qulaqcıqlar",
            "filter-cat-accessory": "Aksesuarlar",
            "filter-memory-label": "Yaddaş (ROM)",
            "filter-ram-label": "Operativ yaddaş (RAM)",
            "ram-2gb": "2 GB",
            "ram-4gb": "4 GB",
            "ram-6gb": "6 GB",
            "ram-8gb": "8 GB",
            "ram-12gb": "12 GB",
            "ram-16gb": "16 GB+",
            "filter-screen-label": "Ekran ölçüsü",
            "screen-small": "5\"-dən kiçik",
            "screen-medium": "5.1\" - 6.0\"",
            "screen-large": "6.1\" - 6.7\"",
            "screen-xlarge": "6.8\"+",
            "filter-battery-label": "Batareya tutumu",
            "battery-low": "3000 mAh-dan az",
            "battery-mid": "3000 - 4500 mAh",
            "battery-high": "4500 mAh+",
            "filter-seller-label": "Satıcı növü",
            "seller-private": "Şəxsi",
            "seller-store": "Mağaza",
            "memory-button-below-64": "64 GB-dən az",
            "memory-button-64": "64 GB",
            "memory-button-128": "128 GB",
            "memory-button-256": "256 GB",
            "memory-button-512": "512 GB",
            "memory-button-512-more": "512 GB və daha çox",
            "finger-print-sensors": "Barmaq izi sensoru",
            "doesnt-matter": "Fərqi yoxdur",
            Available: "Mövcuddur",
            "not-available": "Yoxdur",
            "Not working": "İşləmir",
            yes: "Bəli",
            no: "Xeyr",
            "Water resistance": "Suya davamlılıq",
            "Additional memory": "Əlavə yaddaş",
            Delivery: "Çatdırılma",
            condition: "Vəziyyəti",
            both: "Hər ikisi",
            new: "Yeni",
            used: "İşlənmiş",
            color: "Rəng",
            white: "Ağ", black: "Qara", grey: "Boz", blue: "Göy",
            red: "Qırmızı", green: "Yaşıl", yellow: "Sarı",
            orange: "Narıncı", pink: "Çəhrayı", purple: "Bənövşəyi",
            brown: "Qəhvəyi", gold: "Qızılı", silver: "Gümüşü",
            "apply-select": "Filterləri tətbiq et",
            "reset-btn": "Sıfırla",
            "active-filters": "Aktiv filterlər:",
            "new-announcement": "Yeni Elan",
            "vip-announcement": "VİP ELANLAR",
            "all-view": "Hamısını göstər",
            "all-announcement": "BÜTÜN ELANLAR",
            "sort-by-date": "Tarixə görə",
            "sort-price-high": "Bahadan ucuza",
            "sort-price-low": "Ucuzdan bahaya",
            faq: "Tez-tez verilən suallar",
            "rules-safety": "Qaydalar və Təhlükəsizlik",
            "posting-rules": "Elan yerləşdirmə qaydaları",
            "privacy-policy": "Məxfilik siyasəti",
            "useful-links": "Faydalı Linklər",
            contact: "Əlaqə",
            "faq-title": "Tez-tez Verilən Suallar",
            "faq-q1": "Mobilim.az-da elan yerləşdirmək ödənişlidir?",
            "faq-a1": "Xeyr, platformamızda standart elan yerləşdirmək tamamilə ödənişsizdir. Əgər elanınızın daha geniş auditoriyaya və daha qısa zamanda çatmasını istəyirsinizsə, VIP və ya Premium xidmətlərimizdən yararlana bilərsiniz.",
            "faq-q2": "Necə qeydiyyatdan keçə bilərəm?",
            "faq-a2": "Qeydiyyat prosesi çox sadədir. Saytın yuxarı sağ küncündəki «Qeydiyyat» bölməsinə daxil olub, mobil nömrənizi qeyd edərək asanlıqla öz profilinizi yarada bilərsiniz.",
            "faq-q3": "Yeni elan necə əlavə edilir?",
            "faq-a3": "Şəxsi kabinetinizə daxil olduqdan sonra «Yeni Elan» düyməsinə klikləyin. Cihazınızın göstəricilərini dəqiq qeyd edin, cəlbedici şəkillər əlavə edin və elanınızı təsdiqləyin. Çox qısa zamanda elanınız aktivləşəcək.",
            "faq-q4": "Bir elana maksimum neçə şəkil əlavə etmək olar?",
            "faq-a4": "Hər bir elan üçün maksimum 6 ədəd yüksək keyfiyyətli şəkil yükləyə bilərsiniz. Şəkillərin aydın olması və cihazınızı fərqli rakurslardan göstərməsi, satış ehtimalını əhəmiyyətli dərəcədə artırır.",
            "faq-q5": "Elanım nə vaxt saytda aktiv olacaq?",
            "faq-a5": "Elanlar yerləşdirildikdən sonra standartlara və qaydalara cavab verməsi üçün qısa yoxlama prosesindən keçir. Qaydalara zidd bir hal olmazsa, bir neçə dəqiqə ərzində saytda yayımlanır.",
            "faq-q6": "Bəyəndiyim cihazın satıcısı ilə necə əlaqə yarada bilərəm?",
            "faq-a6": "Hər bir elanın aşağı hissəsində satıcının əlaqə nömrəsi qeyd olunub. Oradakı «Zəng et» və ya «Mesaj göndər» funksiyası ilə birbaşa əlaqə qura bilərsiniz.",
            "faq-q7": "Öz elanımda dəyişiklik edə bilərəmmi?",
            "faq-a7": "Bəli, şəxsi kabinetinizə daxil olaraq «Mənim elanlarım» bölməsində istədiyiniz elanın üzərində dəyişiklik edə bilərsiniz. Dəyişikliklərdən sonra elan yenidən qısa yoxlamadan keçəcək.",
            "faq-q8": "Elanlar saytda neçə gün aktiv qalır?",
            "faq-a8": "Platformamızda yerləşdirilən hər bir elan 30 gün müddətində aktiv qalır. Müddət bitdikdən sonra elan avtomatik olaraq arxivə keçirilir və istəyinizə uyğun olaraq yenidən bərpa edilə bilər.",
            "faq-q9": "Şübhəli və ya qaydaları pozan elanla rastlaşsam nə etməliyəm?",
            "faq-a9": "İstifadəçilərimizin təhlükəsizliyi bizim üçün başlıca prioritetdir. Hər hansı şübhəli elan görsəniz, elanın altındakı «Şikayət et» düyməsini klikləyərək bizi məlumatlandıra bilərsiniz.",
            "faq-q10": "VIP elanın hansı üstünlükləri var?",
            "faq-a10": "VIP elanlar axtarış nəticələrində həmişə ən üst sıralarda yer alır, xüsusi rənglə vurğulanmış formada görünüşlə fərqlənir və əsas səhifədə nümayiş olunur. Bu isə cihazınızın dəfələrlə daha tez satılmasına kömək edir.",
            "login-title": "Hesaba Giriş",
            "login-facebook": "Facebook ilə",
            "login-google": "Google ilə",
            "login-or": "və ya",
            "login-username-placeholder": "İstifadəçi adı və ya email",
            "login-password-placeholder": "Şifrə",
            "login-remember": "Məni xatırla",
            "login-forgot": "Şifrəni unutmusunuz?",
            "login-submit": "Daxil Ol",
            "login-no-account": "Hesabınız yoxdur?",
            "login-signup-link": "Qeydiyyatdan keçin",
            "signup-title": "Qeydiyyatdan Keç",
            "signup-firstname-placeholder": "Ad",
            "signup-lastname-placeholder": "Soyad",
            "signup-email-placeholder": "Email ünvanı",
            "signup-phone-placeholder": "Telefon nömrəsi",
            "signup-confirm-password-placeholder": "Şifrəni təsdiqlə",
            "signup-terms-agree": "ilə razıyam",
            "signup-terms": "İstifadə şərtləri",
            "signup-privacy": "Gizlilik siyasəti",
            "signup-and": "və",
            "signup-has-account": "Artıq hesabınız var?",
            "signup-login-link": "Daxil olun",
            "about-page-title": "Haqqımızda - Mobilim.az",
            "about-h1": "Mobilim.az — Azərbaycanda Mobil Cihazların Yeni və Etibarlı Ticarət Platforması",
            "about-sub": "Mobil cihazlar və aksesuarları üzrə ixtisaslaşmış ticarət platforması",
            "about-p1": "Azərbaycanın elektron ticarət sektorunda <b style=\"color: blueviolet;\">Mobilim.az</b> smartfonlar, planşetlər, qulaqlıqlar və mobil aksesuarlar üzrə ixtisaslaşmış innovativ platformadır. Ənənəvi elan saytlarından fərqli olaraq, sırf mobil texnologiyalara fokuslanaraq həm alıcılar, həm də satıcılar üçün sürətli, təhlükəsiz və məqsədyönlü ticarət mühiti yaradırıq.",
            "about-p2": "Platformamız vasitəsilə həm fərdi istifadəçilər, həm də mağazalar yeni və ya işlənmiş mobil cihaz və aksesuarların alqı-satqısını rahatlıqla həyata keçirə bilərlər.",
            "about-p3": "Hər büdcəyə uyğun geniş çeşiddə məhsulları bir araya gətirən Mobilim.az, təklif edilən cihazların ətraflı texniki göstəricilərini, qiymətini və vəziyyətini (yeni/işlənmiş) şəffaf şəkildə təqdim edir. Əsas məqsədimiz bazardakı optimal seçimləri bir platformada cəmləşdirərək axtarış prosesini sadələşdirməkdir.",
            "about-h2-1": "Platformamızda Hansı Məhsullar Təqdim Olunur?",
            "about-ul1-1": "Yeni və işlənmiş smartfonlar, bütün marka və qiymət aralıqları",
            "about-ul1-2": "Apple, Samsung, Xiaomi və digər istehsalçılardan planşet modelləri",
            "about-ul1-3": "Simli və simsiz qulaqlıqlar, audio aksesuarlar",
            "about-ul1-4": "Adapterlər, qoruyucu örtüklər, ekran qoruyucuları və digər mobil aksesuarlar",
            "about-category-summary": "Həm alıcılar, həm də satıcılar Mobilim.az-da işlərini asanlıqla həll edirlər. Elanınızı pulsuz yerləşdirin, alıcı tapın.",
            "about-h2-2": "Niyə məhz Mobilim.az?",
            "about-ul2-1": "İxtisaslaşmış bazar: Smartfonlar, planşetlər, qulaqlıqlar və mobil aksesuarlar üzrə ixtisaslaşmış ticarət ekosistemi.",
            "about-ul2-2": "Rahat axtarış və filtrlər: Qabaqcıl kateqoriya, marka, qiymət və vəziyyət filtrləri sayəsində istənilən modeli saniyələr içində tapmaq imkanı.",
            "about-ul2-3": "Etibarlı ticarət mühiti: Satıcı və mağazalar üçün şəffaf reytinq və real müştəri rəyləri sistemi.",
            "about-ul2-4": "Elastik elan paketləri: İstifadəçi və mağazaların tələblərinə uyğunlaşdırılmış Standart, PRO və VIP elan paketləri.",
            "about-h2-3": "Mobilim.az Necə İşləyir?",
            "about-p4": "Platformamız həm fərdi satıcılar, həm də rəsmi mağazalar üçün əlverişli və təhlükəsiz satış mühiti yaradır.",
            "about-h3-1": "1. Fərdi Satıcılar Üçün",
            "about-ul3-1": "Sürətli satış: Cihaz və ya aksesuarlarınızı pulsuz və ya təşviqat paketləri ilə asanlıqla satışa çıxara bilərsiniz.",
            "about-ul3-2": "Birbaşa əlaqə: Daxili mesajlaşma sistemi və ya əlaqə nömrəsi vasitəsilə alıcılarla operativ ünsiyyət.",
            "about-ul3-3": "Hədəfli axtarış: Alıcılar elanları kateqoriya, qiymət, marka və vəziyyət üzrə dəqiqliklə seçə bilirlər.",
            "about-h3-2": "2. Korporativ Mağazalar Üçün",
            "about-ul4-1": "Rəsmi mağaza profili: Texnologiya mağazaları Mobilim.az-da qeydiyyatdan keçərək öz mağaza səhifələrini aça bilərlər.",
            "about-ul4-2": "Mağaza idarəetməsi və təşviqat: Mağazalar üçün xüsusi panel və PRO/VIP paketlərlə elanları önə çıxarma imkanı.",
            "about-ul4-3": "Geniş vitrin: Mağazalar mobil cihaz və aksesuarlarını birbaşa maraqlanan alıcı kütləsinə nümayiş etdirirlər.",
            "about-h2-4": "Gələcək Hədəflər və İnkişaf Planları",
            "about-ul5-1": "Mobil tətbiq (Gələcək plan): iOS və Android əməliyyat sistemləri üçün Mobilim.az mobil tətbiqinin istifadəyə verilməsi.",
            "about-ul5-2": "Süni İntellekt (AI) inteqrasiyası (Gələcək plan): Ağıllı axtarış və istifadəçilərə uyğun cihazların tövsiyə edilməsi alqoritmləri.",
            "about-ul5-3": "Avtomatlaşdırılmış elan moderasiyası (Gələcək plan): Saxta elanların aşkarlanması üçün maşın öyrənməsi həlləri (hazırda elanlar moderatorlar tərəfindən yoxlanılır).",
            "about-p5": "Mobilim.az — Azərbaycanda smartfonlar, planşetlər, qulaqlıqlar və mobil aksesuarların alqı-satqısını sadə və etibarlı edən ixtisaslaşmış elan platformasıdır.",
            "about-tagline": "Mobilim.az — Mobil texnologiyalar və aksesuarların etibarlı ticarət məkanı.",
            "stores-h1": "Sevdiyiniz mağazaları kəşf edin",
            "stores-p": "Sizin üçün ən yaxşı mağazaları bir araya gətirdik",
            "stores-search-placeholder": "Mağaza axtar...",
            "stores-search-btn": "Axtar",
            "stores-add-btn": "Mağaza aç",
            "stores-view-btn": "Mağazaya bax",
            "stores-contact-btn": "Əlaqə",
            "phone-h2": "Telefon modelləri",
            "elan-h2": "Yeni Elan Yerləşdir",
            "elan-category": "Kateqoriya",
            "elan-brand": "Marka",
            "elan-model": "Model",
            "elan-model-placeholder": "Məsələn: iPhone 14 Pro",
            "elan-city": "Şəhər",
            "elan-price": "Qiymət (AZN)",
            "elan-condition": "Vəziyyəti",
            "elan-memory": "Yaddaş (GB)",
            "elan-color": "Rəng",
            "elan-fingerprint": "Barmaq izi sensoru",
            "elan-nfc": "NFC",
            "elan-waterproof": "Suya davamlılıq",
            "elan-expandable": "Əlavə yaddaş",
            "elan-delivery": "Çatdırılma",
            "elan-desc": "Təsvir (Ətraflı məlumat)",
            "elan-desc-placeholder": "Telefonun ümumi vəziyyəti, nəyə görə satılır və s.",
            "elan-images": "Şəkil yüklə",
            "elan-images-small": "Ən az 1, maksimum 10 şəkil. Hər biri max 5MB.",
            "elan-phone": "Əlaqə nömrəsi",
            "elan-phone-placeholder": "+994 XX XXX XX XX",
            "elan-submit": "Elan yerləşdir",
            "elan-rules-h3": "Qaydalar",
            "elan-rule1": "Elanın müddəti 30 gündür.",
            "elan-rule2": "Eyni elanı bir neçə dəfə təqdim etməyin.",
            "elan-rule3": "Məhsulunuzu mümkün qədər ətraflı təsvir edin.",
            "elan-rule4": "Başlıq yerində qiymət yazmayın - bunun üçün ayrıca yer var.",
            "elan-rule5": "Elanınızla bağlı bütün məlumatlar sizin e-mail ünvanınıza göndərilir.",
            "elan-rule6": "Təsvir və şəkillərdə telefon, email və sayt ünvanı göstərməyin.",
            "elan-rule7": "Real məhsul təsviri və şəkli istifadə edin.",
            "elan-rule8": "Şəkillər keyfiyyətli olmalıdır.",
            "elan-rule9": "Hər kateqoriyada limit mövcuddur.",
            "elan-rule10": "Məhsulun zəmanəti varsa, təsvir bölməsində qeyd edilməlidir.",
            "elan-rule11": "Elan yerləşdirərkən etik qaydalara riayət edin.",
            "elan-select": "Seçin",
            "fav-h1": "Seçilmişlər",
            "fav-empty-p": "Hələ heç bir elan seçilmişlərə əlavə edilməyib.",
            "fav-empty-a": "Elanlara baxın",
            "cabinet-title": "Şəxsi Kabinet",
            "cab-profile": "Profil",
            "cab-my-ads": "Mənim elanlarım",
            "cab-messages": "Mesajlar",
            "cab-settings": "Tənzimləmələr",
            "cab-logout": "Çıxış",
            "cab-welcome": "Xoş gəldiniz,",
            "cab-active-ads": "Aktiv elanlar",
            "cab-total-views": "Ümumi baxış",
            "cab-favorites": "Seçilmişlər",
            "cab-personal-info": "Şəxsi məlumatlar",
            "cab-name-lbl": "Ad:",
            "cab-surname-lbl": "Soyad:",
            "cab-phone-lbl": "Telefon:",
            "cab-email-lbl": "E-poçt:",
            "cab-edit-btn": "Redaktə et",
            "cab-standard-acc": "Standart Hesab",
            "cab-dashboard": "İdarə Paneli",
            "cab-dashboard-desc": "Xoş gəldiniz. Bugünkü statistikanızla tanış olun.",
            "cab-new-ad": "Yeni Elan",
            "cab-balance": "Balansınız",
            "cab-increase": "Artır",
            "cab-buy-package": "Paket al",
            "cab-total-views-month": "Ümumi baxış (Bu ay)",
            "cab-wa-clicks": "WhatsApp keçidləri",
            "cab-recent-activity": "Son Aktivlik",
            "cab-ref-bonus": "Referal Bonusu",
            "cab-ref-bonus-desc": "Dostunuz \"Həsən Ə.\" qeydiyyatdan keçdiyi üçün 5 AZN qazandınız.",
            "cab-sys-login": "Sistem Girişi",
            "cab-sys-login-desc": "Hesabınıza yeni giriş aşkarlandı (Bakı, 192.168.1.1)",
            "cab-my-ads-desc": "Bütün aktiv və passiv elanlarınızı idarə edin.",
            "cab-filter-all": "Bütün elanlar",
            "cab-filter-active": "Aktiv",
            "cab-filter-pending": "Yoxlanılır",
            "cab-filter-expired": "Müddəti bitmiş",
            "cab-messages-desc": "Alıcı və satıcılarla əlaqə",
            "cab-search-msg": "Mesaj axtar...",
            "cab-msg-empty": "Mesaj qutunuz boşdur.",
            "cab-no-user": "İstifadəçi seçilməyib",
            "cab-select-msg": "Söhbətə başlamaq üçün soldan mesaj seçin",
            "cab-write-msg": "Mesajınızı yazın...",
            "cab-settings-desc": "Hesab məlumatlarınızı idarə edin",
            "cab-notifications": "Bildirişlər",
            "cab-security": "Təhlükəsizlik",
            "cab-privacy": "Məxfilik",
            "cab-name": "Ad",
            "cab-surname": "Soyad",
            "cab-email": "Email",
            "cab-phone": "Telefon",
            "cab-save": "Yadda saxla",
            "cab-notif-desc": "Platformadan hansı məlumatları necə almaq istədiyinizi seçin.",
            "cab-email-notifs": "Email Bildirişləri",
            "cab-new-msgs": "Yeni Mesajlar",
            "cab-new-msgs-desc": "Kimsə sizə alıcı və ya satıcı kimi mesaj yazdıqda dərhal email alın",
            "cab-ad-status": "Elan Statusu",
            "cab-ad-status-desc": "Elanınız təsdiqləndikdə, rədd edildikdə və ya müddəti bitdikdə",
            "cab-news-camp": "Xəbərlər və Kampaniyalar",
            "cab-news-camp-desc": "Mobilim.az-dan yeniliklər, endirimlər və xüsusi təkliflər barədə xəbərlər",
            "cab-curr-pass": "Cari Şifrə",
            "cab-new-pass": "Yeni Şifrə",
            "cab-2fa": "İki mərhələli təsdiqləməni (2FA) aktiv et",
            "cab-update": "Yenilə",
            "cab-acc-manage": "Hesabın İdarəedilməsi",
            "cab-freeze-acc": "Hesabı Dondur",
            "cab-freeze-desc": "Hesabınız və bütün aktiv elanlarınız müvəqqəti olaraq gizlədiləcək.",
            "cab-freeze-btn": "Dondur",
            "cab-del-acc": "Hesabı Sil",
            "cab-del-desc": "Bütün məlumatlarınız və elanlarınız həmişəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz.",
            "cab-del-btn": "Hesabı Sil",
            "cab-priv-desc": "Məlumatlarınızın platformada necə görünəcəyini idarə edin.",
            "cab-show-num": "Nömrəni Göstər",
            "cab-show-num-desc": "Bütün elanlarınızda əlaqə nömrəniz alıcılara göstərilsin",
            "cab-allow-msg": "Mesajlara İcazə Ver",
            "cab-allow-msg-desc": "Digər istifadəçilər daxili sistem vasitəsilə sizə mesaj yaza bilsin",
            "cab-online-status": "Onlayn Statusu",
            "cab-online-desc": "Profilinizdə nə vaxt onlayn olduğunuz görünsün",
            "cab-social-title": "Sosial Hesablar",
            "cab-social-desc": "Daha sürətli və təhlükəsiz giriş üçün sosial media hesablarınızı bağlayın.",
            "cab-unlinked": "Bağlanmayıb",
            "cab-link": "Bağla",
            "cab-billing": "Paket və Ödənişlər",
            "cab-curr-pkg": "Cari Paket",
            "cab-no-pkg": "Heç bir fəal paket yoxdur.",
            "cab-pay-hist": "Ödəniş Tarixçəsi",
            "cab-no-trans": "Heç bir əməliyyat tapılmadı.",
            "mon-referral-title": "Dostunu gətir, 5 AZN qazan!",
            "mon-referral-desc": "Hər dəvət etdiyiniz dostunuz qeydiyyatdan keçdikdə balansınıza 5 AZN hədiyyə olunacaq.",
            "mon-referral-credit": "Referal balansı",
            "mon-copy-link": "Kopyala",
            "mon-promote-ad": "Tanıt",
            "mon-bump": "İrəli çək",
            "mon-vip": "VİP",
            "mon-pro": "PRO",
            "mon-duration": "Müddət:",
            "mon-use-credit": "Referal kreditindən istifadə et (max 50%)",
            "mon-total": "Cəmi:",
            "mon-pay-btn": "Ödəniş et",
            // Rules page
            "rules-page-h1": "Qaydalar və Təhlükəsizlik",
            "rules-page-sub": "Platformamızdan təhlükəsiz və rahat istifadə etmək üçün bu qaydaları oxuyun.",
            "rules-tab-general": "Ümumi Qaydalar",
            "rules-tab-posting": "Elan Yerləşdirmə",
            "rules-tab-safety": "Təhlükəsizlik",
            "rules-tab-prohibited": "Qadağalar",
            // Privacy page
            "privacy-page-h1": "Məxfilik Siyasəti",
            "privacy-page-sub": "Mobilim.az istifadəçilərimizin məxfiliyini qorumağı prinsip kimi qəbul edir.",
            "privacy-updated": "Son yenilənmə: Mart 2025",
            "privacy-h2-collect": "Hansı Məlumatları Toplayırıq?",
            "privacy-h2-use": "Məlumatları Necə İstifadə Edirik?",
            "privacy-h2-share": "Məlumatları Paylaşırıqmı?",
            "privacy-h2-cookies": "Çərəzlər (Cookies)",
            "privacy-h2-rights": "İstifadəçi Hüquqları",
            "privacy-h2-security": "Məlumat Təhlükəsizliyi",
            "privacy-h2-changes": "Siyasətdə Dəyişikliklər",
            "privacy-h2-contact": "Bizimlə Əlaqə",
            "det-breadcrumb-home": "Ana Səhifə",
            "det-breadcrumb-phones": "Telefonlar",
            "det-badge-new": "Yeni",
            "det-price-note": "Qiymət sabitdir · Barter mümkündür",
            "det-city-label": "Şəhər:",
            "det-condition-label": "Vəziyyəti:",
            "det-delivery-label": "Çatdırılma:",
            "det-delivery-yes": "Var",
            "det-feat-fingerprint": "Barmaq izi",
            "det-feat-waterproof-chip": "Suya davamlı",
            "det-feat-no-expandable": "Yaddaş kartı yoxdur",
            "det-specs-title": "Texniki Xüsusiyyətlər",
            "det-spec-storage": "Yaddaş",
            "det-spec-screen": "Ekran",
            "det-spec-refresh": "Yeniləmə tezliyi",
            "det-spec-battery": "Batareya",
            "det-spec-processor": "Prosessor",
            "det-spec-cam-rear": "Əsas kamera",
            "det-spec-cam-front": "Ön kamera",
            "det-spec-color": "Rəng",
            "det-spec-condition": "Vəziyyəti",
            "det-spec-available": "Mövcuddur",
            "det-spec-waterproof": "Suya davamlılıq",
            "det-spec-included": "Qutuya daxildir",
            "det-desc-title": "Şəxsi açıqlama",
            "det-reviews-title": "Satıcı rəyləri",
            "det-write-review-title": "Öz rəyinizi yazın",
            "det-review-submit": "Rəy Göndər",
            "det-ad-no": "Elan nömrəsi:",
            "det-posted": "Yerləşdirilib:",
            "det-updated": "Yenilənib:",
            "det-seller-personal": "Şəxsi hesab",
            "det-btn-call": "Nömrəni Göstər",
            "det-btn-whatsapp": "WhatsApp ilə Yazın",
            "det-btn-message": "Mesaj Göndər",
            "det-seller-since": "Üzv olub:",
            "det-sidebar-review-title": "Müsbət rəy yazın",
            "det-safety-title": "Təhlükəsiz Alış",
            "det-safety-1": "Mümkün qədər ictimai yerdə görüşün",
            "det-safety-2": "IMEI kodunu yoxlamadan almayın",
            "det-safety-3": "Avans ödənişindən çəkinin",
            "det-safety-4": "Şübhəli elanı bildirin",
            "det-btn-share": "Paylaş",
            "det-btn-report": "Şikayət et",
            "det-related-title": "Oxşar Elanlar",
            "det-review-name-ph": "Adınız (məs. Əli M.)",
            "det-review-text-ph": "Satıcı ilə təcrübənizi paylaşın...",
            "det-sidebar-review-ph": "Bu satıcı haqqında rəyiniz...",
            "det-reviews-seller-note": "Bu satıcının bütün rəyləri",
            "det-rating-based-on": "rəy əsasında",
            "det-no-reviews": "Bu satıcı üçün hələ rəy yoxdur. İlk rəyi siz yazın!",
            "det-view-store": "Mağazaya bax",
            "footer-copyright": "© 2025 Mobilim.az. Bütün hüquqlar qorunur."
        },
        ENG: {
            Contact: "Contact",
            About: "About",
            Stores: "Stores (soon)",
            "vip-empty": "No VIP ads currently.",
            "ads-empty": "No active ads currently.",
            "search-found": "Found {count} ads",
            "searching": "Searching...",
            "no-results": "No results found",
            "filter-title": "Filters",
            "all-ads": "All ads",
            "clear-filter": "Clear",
            "clear-search": "Clear",
            Favorite: "Favorites",
            "login-btn": "Login",
            "register-btn": "Register",
            "search-btn": "Search",
            "search-placeholder": "Search phones...",
            "language-selector": "ENG",
            "catalog-button": "Catalog",
            phone: "Phones",
            tablet: "Tablets",
            headphone: "Headphones",
            "phone-accessories": "Phone Accessories",
            "search-in-more-detail": "Advanced Search",
            brand: "Brand",
            "all-brand": "All brands",
            other: "Other",
            "select-brand": "Select brand first",
            "price-range": "Price range",
            city: "City",
            "all-city": "All cities",
            Baku: "Baku", Sumqayit: "Sumqayit", Ganja: "Ganja",
            Absheron: "Absheron", Agcabedi: "Aghjabadi", Agdam: "Aghdam",
            Agdash: "Aghdash", Agstafa: "Aghstafa", Agsu: "Aghsu",
            Astara: "Astara", Balakan: "Balakan", Beylagan: "Beylagan",
            Barda: "Barda", Bilasuvar: "Bilasuvar", Dashkasan: "Dashkasan",
            Fuzuli: "Fuzuli", Gadabay: "Gadabay", Goranboy: "Goranboy",
            Goychay: "Goychay", Goygol: "Goygol", Hajigabul: "Hajigabul",
            Imishli: "Imishli", Ismayilli: "Ismayilli", Jabrayil: "Jabrayil",
            Jalilabad: "Jalilabad", Kalbajar: "Kalbajar", Kurdamir: "Kurdamir",
            Lachin: "Lachin", Lankaran: "Lankaran", Lerik: "Lerik",
            Masalli: "Masalli", Mingachevir: "Mingachevir", Naftalan: "Naftalan",
            Nakhchivan: "Nakhchivan", Neftchala: "Neftchala", Oguz: "Oguz",
            Qabala: "Gabala", Qakh: "Gakh", Qazakh: "Gazakh", Quba: "Guba",
            Qubadli: "Gubadli", Qusar: "Gusar", Saatli: "Saatli",
            Sabirabad: "Sabirabad", Salyan: "Salyan", Shabran: "Shabran",
            Shaki: "Shaki", Shamakhi: "Shamakhi", Shirvan: "Shirvan",
            Shusha: "Shusha", Siazan: "Siazan", Tartar: "Tartar",
            Tovuz: "Tovuz", Ujar: "Ujar", Yardimli: "Yardimli",
            Yevlakh: "Yevlakh", Zangilan: "Zangilan", Zaqatala: "Zaqatala",
            Zardab: "Zardab",
            "filter-category-label": "Category",
            "filter-cat-all": "All",
            "filter-cat-phone": "Phones",
            "filter-cat-tablet": "Tablets",
            "filter-cat-headphone": "Headphones",
            "filter-cat-accessory": "Accessories",
            "filter-memory-label": "Storage (ROM)",
            "filter-ram-label": "RAM",
            "ram-2gb": "2 GB",
            "ram-4gb": "4 GB",
            "ram-6gb": "6 GB",
            "ram-8gb": "8 GB",
            "ram-12gb": "12 GB",
            "ram-16gb": "16 GB+",
            "filter-screen-label": "Screen Size",
            "screen-small": "Under 5\"",
            "screen-medium": "5.1\" - 6.0\"",
            "screen-large": "6.1\" - 6.7\"",
            "screen-xlarge": "6.8\"+",
            "filter-battery-label": "Battery Capacity",
            "battery-low": "Under 3000 mAh",
            "battery-mid": "3000 - 4500 mAh",
            "battery-high": "4500 mAh+",
            "filter-seller-label": "Seller Type",
            "seller-private": "Individual",
            "seller-store": "Store",
            "memory-button-below-64": "Below 64 GB",
            "memory-button-64": "64 GB",
            "memory-button-128": "128 GB",
            "memory-button-256": "256 GB",
            "memory-button-512": "512 GB",
            "memory-button-512-more": "512 GB and more",
            "finger-print-sensors": "Fingerprint Sensor",
            "doesnt-matter": "Doesn't matter",
            Available: "Available",
            "not-available": "Not available",
            "Not working": "Not working",
            yes: "Yes",
            no: "No",
            "Water resistance": "Water resistance",
            "Additional memory": "Additional memory",
            Delivery: "Delivery",
            condition: "Condition",
            both: "Both",
            new: "New",
            used: "Used",
            color: "Color",
            white: "White", black: "Black", grey: "Grey", blue: "Blue",
            red: "Red", green: "Green", yellow: "Yellow",
            orange: "Orange", pink: "Pink", purple: "Purple",
            brown: "Brown", gold: "Gold", silver: "Silver",
            "apply-select": "Apply Filters",
            "reset-btn": "Reset",
            "active-filters": "Active filters:",
            "new-announcement": "New Ad",
            "vip-announcement": "VIP ADS",
            "all-view": "Show all",
            "all-announcement": "ALL ADS",
            "sort-by-date": "By date",
            "sort-price-high": "Price: high to low",
            "sort-price-low": "Price: low to high",
            faq: "FAQ",
            "rules-safety": "Rules & Safety",
            "posting-rules": "Ad posting rules",
            "privacy-policy": "Privacy Policy",
            "useful-links": "Useful Links",
            contact: "Contact Us",
            "faq-title": "Frequently Asked Questions",
            "faq-q1": "Is posting an ad on Mobilim.az paid?",
            "faq-a1": "No, posting a standard ad on our platform is completely free. If you want your ad to reach a wider audience in a shorter time, you can benefit from our VIP services.",
            "faq-q2": "How can I register?",
            "faq-a2": "The registration process is very simple. Go to the Register section in the top right corner of the site, enter your mobile number, and create your profile in seconds.",
            "faq-q3": "How do I add a new ad?",
            "faq-a3": "After logging into your personal cabinet, click the New Ad button. Accurately enter your device's specifications, add attractive photos, and confirm your ad. It will be published very shortly.",
            "faq-q4": "What is the maximum number of photos I can add to an ad?",
            "faq-a4": "You can upload a maximum of 6 high-quality photos per ad. Clear photos showing your device from different angles significantly increase the likelihood of a quick sale.",
            "faq-q5": "When will my ad be active on the site?",
            "faq-a5": "After posting, ads go through a short review process to ensure they meet our standards. If there are no violations, they go live on the site within a few minutes.",
            "faq-q6": "How can I contact the seller of a device I like?",
            "faq-a6": "The seller's contact number is noted at the bottom of each ad. You can also contact them directly using the Call or Send Message feature.",
            "faq-q7": "Can I make changes to my ad?",
            "faq-a7": "Yes, you can edit any of your ads by going to the My ads section in your personal cabinet. After making changes, the ad will go through a short review again.",
            "faq-q8": "How many days do ads stay active on the site?",
            "faq-a8": "Each ad placed on our platform remains active for 30 days. After this period, the ad is automatically moved to the archive and can be restored at your request.",
            "faq-q9": "What should I do if I come across a suspicious ad breaking the rules?",
            "faq-a9": "The security of our users is our top priority. If you encounter any suspicious ad, please let us know by clicking the Report button on the ad page.",
            "faq-q10": "What are the advantages of a VIP ad?",
            "faq-a10": "VIP ads always rank at the top of search results, stand out with a special design, and are displayed on the homepage. This helps your device sell ten times faster.",
            "login-title": "Login to Account",
            "login-facebook": "With Facebook",
            "login-google": "With Google",
            "login-or": "or",
            "login-username-placeholder": "Username or email",
            "login-password-placeholder": "Password",
            "login-remember": "Remember me",
            "login-forgot": "Forgot password?",
            "login-submit": "Login",
            "login-no-account": "Don't have an account?",
            "login-signup-link": "Sign up",
            "signup-title": "Sign Up",
            "signup-firstname-placeholder": "First Name",
            "signup-lastname-placeholder": "Last Name",
            "signup-email-placeholder": "Email address",
            "signup-phone-placeholder": "Phone number",
            "signup-confirm-password-placeholder": "Confirm password",
            "signup-terms-agree": "I agree with",
            "signup-terms": "Terms of Use",
            "signup-privacy": "Privacy Policy",
            "signup-and": "and",
            "signup-has-account": "Already have an account?",
            "signup-login-link": "Log in",
            "about-page-title": "About Us - Mobilim.az",
            "about-h1": "Mobilim.az — Modern and Reliable Tech Marketplace in Azerbaijan",
            "about-sub": "Specialized marketplace for mobile devices and accessories",
            "about-p1": "In Azerbaijan's e-commerce sector, <b style=\"color: blueviolet;\">Mobilim.az</b> is an innovative marketplace specialized in smartphones, tablets, headphones, and mobile accessories. Focusing specifically on mobile technology provides buyers and sellers with a fast, secure, and targeted trading environment.",
            "about-p2": "Through our platform, individuals and stores can easily buy and sell new and used mobile devices and accessories.",
            "about-p3": "Bringing together products across all price points, Mobilim.az transparently displays technical specifications, prices, and condition (new/used) to simplify your search experience.",
            "about-h2-1": "What Products Are Featured on Mobilim.az?",
            "about-ul1-1": "New and used smartphones across all brands and price ranges",
            "about-ul1-2": "Tablet models from Apple, Samsung, Xiaomi and other manufacturers",
            "about-ul1-3": "Wired and wireless headphones, audio accessories",
            "about-ul1-4": "Adapters, protective covers, screen protectors and other accessories",
            "about-category-summary": "Both buyers and sellers manage their deals easily on Mobilim.az. Post your ad for free and find buyers.",
            "about-h2-2": "Why Choose Mobilim.az?",
            "about-ul2-1": "Specialized market: Ecosystem focused on smartphones, tablets, headphones, and mobile accessories.",
            "about-ul2-2": "Easy search and filters: Find desired models in seconds with filters for category, brand, price range, and condition.",
            "about-ul2-3": "Reliable trading environment: Transparent seller and store ratings backed by real customer reviews.",
            "about-ul2-4": "Flexible listing packages: Standard, PRO, and VIP listing packages tailored to individual and store needs.",
            "about-h2-3": "How Does Mobilim.az Work?",
            "about-p4": "Our platform creates a convenient and safe sales environment for both individual sellers and verified stores.",
            "about-h3-1": "1. For Individual Sellers",
            "about-ul3-1": "Quick selling: Post your devices or accessories easily for free or with promotion packages.",
            "about-ul3-2": "Direct contact: Fast communication with buyers through in-app messaging or direct phone calls.",
            "about-ul3-3": "Targeted search: Buyers can pinpoint listings by category, brand, condition, and price.",
            "about-h3-2": "2. For Stores",
            "about-ul4-1": "Official store profile: Electronics stores can register and build their branded store storefronts.",
            "about-ul4-2": "Store management & promotions: Dedicated store dashboard with PRO and VIP listing exposure tools.",
            "about-ul4-3": "Targeted showcase: Showcase inventory directly to customers specifically searching for mobile devices.",
            "about-h2-4": "Future Goals & Roadmap",
            "about-ul5-1": "Mobile App (Roadmap): Launching dedicated iOS and Android apps for mobile browsing and ad posting.",
            "about-ul5-2": "AI Integration (Roadmap): Smart search and recommendation algorithms tailored to user preferences.",
            "about-ul5-3": "Automated moderation (Roadmap): Machine learning fraud detection models (ads are currently reviewed by moderators).",
            "about-p5": "Mobilim.az is a specialized marketplace making the buying and selling of smartphones, tablets, headphones, and mobile accessories in Azerbaijan simple and reliable.",
            "about-tagline": "Mobilim.az — Your Reliable Mobile Technology Marketplace.",
            "stores-h1": "Discover your favorite stores",
            "stores-p": "We have brought together the best stores for you",
            "stores-search-placeholder": "Search store...",
            "stores-search-btn": "Search",
            "stores-add-btn": "Open Store",
            "stores-view-btn": "View store",
            "stores-contact-btn": "Contact",
            "phone-h2": "Phone models",
            "elan-h2": "Place New Ad",
            "elan-category": "Category",
            "elan-brand": "Brand",
            "elan-model": "Model",
            "elan-model-placeholder": "E.g.: iPhone 14 Pro",
            "elan-city": "City",
            "elan-price": "Price (AZN)",
            "elan-condition": "Condition",
            "elan-memory": "Memory (GB)",
            "elan-color": "Color",
            "elan-fingerprint": "Fingerprint sensor",
            "elan-nfc": "NFC",
            "elan-waterproof": "Water resistance",
            "elan-expandable": "Additional memory",
            "elan-delivery": "Delivery",
            "elan-desc": "Description (Detailed info)",
            "elan-desc-placeholder": "General condition of the phone, why it's being sold, etc.",
            "elan-images": "Upload Image",
            "elan-images-small": "Min 1, max 10 images. Max 5MB each.",
            "elan-phone": "Contact number",
            "elan-phone-placeholder": "+994 XX XXX XX XX",
            "elan-submit": "Publish Ad",
            "elan-rules-h3": "Rules",
            "elan-rule1": "Ad duration is 30 days.",
            "elan-rule2": "Do not submit the same ad multiple times.",
            "elan-rule3": "Describe your product as detailed as possible.",
            "elan-rule4": "Do not write the price in the title - there is a separate place for it.",
            "elan-rule5": "All information regarding your ad is sent to your e-mail address.",
            "elan-rule6": "Do not show phone, e-mail and site address in the description and pictures.",
            "elan-rule7": "Use actual product description and picture.",
            "elan-rule8": "Pictures must be of high quality.",
            "elan-rule9": "There is a limit in each category.",
            "elan-rule10": "If the product has a warranty, it should be noted in the description section.",
            "elan-rule11": "Observe ethical rules when posting an ad.",
            "elan-select": "Select",
            "fav-h1": "Favorites",
            "fav-empty-p": "No ads have been added to favorites yet.",
            "fav-empty-a": "View ads",
            "cabinet-title": "Personal Cabinet",
            "cab-profile": "Profile",
            "cab-my-ads": "My Ads",
            "cab-messages": "Messages",
            "cab-settings": "Settings",
            "cab-logout": "Logout",
            "cab-welcome": "Welcome,",
            "cab-active-ads": "Active Ads",
            "cab-total-views": "Total Views",
            "cab-favorites": "Favorites",
            "cab-personal-info": "Personal Information",
            "cab-name-lbl": "First Name:",
            "cab-surname-lbl": "Last Name:",
            "cab-phone-lbl": "Phone:",
            "cab-email-lbl": "Email:",
            "cab-edit-btn": "Edit",
            "cab-standard-acc": "Standard Account",
            "cab-dashboard": "Dashboard",
            "cab-dashboard-desc": "Welcome. Review your stats for today.",
            "cab-new-ad": "New Ad",
            "cab-balance": "Your Balance",
            "cab-increase": "Top Up",
            "cab-buy-package": "Buy Package",
            "cab-total-views-month": "Total Views (This Month)",
            "cab-wa-clicks": "WhatsApp Clicks",
            "cab-recent-activity": "Recent Activity",
            "cab-ref-bonus": "Referral Bonus",
            "cab-ref-bonus-desc": "You earned 5 AZN because your friend \"Hasan A.\" registered.",
            "cab-sys-login": "System Login",
            "cab-sys-login-desc": "A new login to your account was detected (Baku, 192.168.1.1)",
            "cab-my-ads-desc": "Manage all your active and inactive ads.",
            "cab-filter-all": "All Ads",
            "cab-filter-active": "Active",
            "cab-filter-pending": "Pending Review",
            "cab-filter-expired": "Expired",
            "cab-messages-desc": "Contact buyers and sellers",
            "cab-search-msg": "Search messages...",
            "cab-msg-empty": "Your inbox is empty.",
            "cab-no-user": "No user selected",
            "cab-select-msg": "Choose a message from the left to start chatting",
            "cab-write-msg": "Write your message...",
            "cab-settings-desc": "Manage your account information",
            "cab-notifications": "Notifications",
            "cab-security": "Security",
            "cab-privacy": "Privacy",
            "cab-name": "First Name",
            "cab-surname": "Last Name",
            "cab-email": "Email",
            "cab-phone": "Phone",
            "cab-save": "Save",
            "cab-notif-desc": "Choose what information you want to receive from the platform and how.",
            "cab-email-notifs": "Email Notifications",
            "cab-new-msgs": "New Messages",
            "cab-new-msgs-desc": "Receive an email immediately when someone messages you as a buyer or seller",
            "cab-ad-status": "Ad Status",
            "cab-ad-status-desc": "When your ad is approved, rejected, or expires",
            "cab-news-camp": "News and Campaigns",
            "cab-news-camp-desc": "Updates, discounts, and special offers from Mobilim.az",
            "cab-curr-pass": "Current Password",
            "cab-new-pass": "New Password",
            "cab-2fa": "Enable two-factor authentication (2FA)",
            "cab-update": "Update",
            "cab-acc-manage": "Account Management",
            "cab-freeze-acc": "Freeze Account",
            "cab-freeze-desc": "Your account and all active ads will be hidden temporarily.",
            "cab-freeze-btn": "Freeze",
            "cab-del-acc": "Delete Account",
            "cab-del-desc": "All your data and ads will be deleted permanently. This action cannot be undone.",
            "cab-del-btn": "Delete Account",
            "cab-priv-desc": "Control how your information appears on the platform.",
            "cab-show-num": "Show Phone Number",
            "cab-show-num-desc": "Display your contact number on all your ads",
            "cab-allow-msg": "Allow Messages",
            "cab-allow-msg-desc": "Let other users send you messages through the internal system",
            "cab-online-status": "Online Status",
            "cab-online-desc": "Show when you were last online on your profile",
            "cab-social-title": "Social Accounts",
            "cab-social-desc": "Connect your social media accounts for faster and safer sign-in.",
            "cab-unlinked": "Not connected",
            "cab-link": "Connect",
            "cab-billing": "Packages and Payments",
            "cab-curr-pkg": "Current Package",
            "cab-no-pkg": "There is no active package.",
            "cab-pay-hist": "Payment History",
            "cab-no-trans": "No transactions found.",
            "mon-referral-title": "Invite a friend, earn 5 AZN!",
            "mon-referral-desc": "You will receive 5 AZN to your balance for every friend you invite who registers.",
            "mon-referral-credit": "Referral balance",
            "mon-copy-link": "Copy",
            "mon-promote-ad": "Promote",
            "mon-bump": "Bump Up",
            "mon-vip": "VIP",
            "mon-pro": "PRO",
            "mon-duration": "Duration:",
            "mon-use-credit": "Use referral credit (max 50%)",
            "mon-total": "Total:",
            "mon-pay-btn": "Pay",
            // Rules page
            "rules-page-h1": "Rules & Safety",
            "rules-page-sub": "Read these rules to use our platform safely and comfortably.",
            "rules-tab-general": "General Rules",
            "rules-tab-posting": "Ad Posting",
            "rules-tab-safety": "Safety",
            "rules-tab-prohibited": "Prohibited",
            // Privacy page
            "privacy-page-h1": "Privacy Policy",
            "privacy-page-sub": "Mobilim.az considers protecting the privacy of our users as a principle.",
            "privacy-updated": "Last updated: March 2025",
            "privacy-h2-collect": "What Data Do We Collect?",
            "privacy-h2-use": "How Do We Use the Data?",
            "privacy-h2-share": "Do We Share Data?",
            "privacy-h2-cookies": "Cookies",
            "privacy-h2-rights": "User Rights",
            "privacy-h2-security": "Data Security",
            "privacy-h2-changes": "Changes to Policy",
            "privacy-h2-contact": "Contact Us",
            "det-breadcrumb-home": "Home",
            "det-breadcrumb-phones": "Phones",
            "det-badge-new": "New",
            "det-price-note": "Fixed price · Barter possible",
            "det-city-label": "City:",
            "det-condition-label": "Condition:",
            "det-delivery-label": "Delivery:",
            "det-delivery-yes": "Available",
            "det-feat-fingerprint": "Fingerprint",
            "det-feat-waterproof-chip": "Waterproof",
            "det-feat-no-expandable": "No memory card",
            "det-specs-title": "Technical Specifications",
            "det-spec-storage": "Storage",
            "det-spec-screen": "Screen",
            "det-spec-refresh": "Refresh rate",
            "det-spec-battery": "Battery",
            "det-spec-processor": "Processor",
            "det-spec-cam-rear": "Main camera",
            "det-spec-cam-front": "Front camera",
            "det-spec-color": "Color",
            "det-spec-condition": "Condition",
            "det-spec-available": "In stock",
            "det-spec-waterproof": "Water resistance",
            "det-spec-included": "Included in box",
            "det-desc-title": "Description",
            "det-reviews-title": "Seller Reviews",
            "det-write-review-title": "Write a Review",
            "det-review-submit": "Submit Review",
            "det-ad-no": "Ad number:",
            "det-posted": "Posted:",
            "det-updated": "Updated:",
            "det-seller-personal": "Personal account",
            "det-btn-call": "Show Number",
            "det-btn-whatsapp": "WhatsApp",
            "det-btn-message": "Send Message",
            "det-seller-since": "Member since:",
            "det-sidebar-review-title": "Write a review",
            "det-safety-title": "Safe Purchase",
            "det-safety-1": "Meet in public places if possible",
            "det-safety-2": "Do not buy without checking IMEI code",
            "det-safety-3": "Avoid advance payments",
            "det-safety-4": "Report suspicious ad",
            "det-btn-share": "Share",
            "det-btn-report": "Report",
            "det-related-title": "Similar Ads",
            "det-review-name-ph": "Your name (e.g. John D.)",
            "det-review-text-ph": "Share your experience with the seller...",
            "det-sidebar-review-ph": "Your review about this seller...",
            "det-reviews-seller-note": "All reviews for this seller",
            "det-rating-based-on": "based on reviews",
            "det-no-reviews": "No reviews for this seller yet. Be the first to review!",
            "det-view-store": "View store",
            "footer-copyright": "© 2025 Mobilim.az. All rights reserved."
        },
        RUS: {
            Contact: "Контакт",
            About: "О нас",
            Stores: "Магазины (скоро)",
            "vip-empty": "В настоящее время нет VIP-объявлений",
            "ads-empty": "Объявлений пока нет",
            "search-found": "Найдено {count} объявлений",
            "searching": "Поиск...",
            "no-results": "Результатов не найдено",
            "filter-title": "Фильтры",
            "all-ads": "Все объявления",
            "clear-filter": "Очистить",
            "clear-search": "Очистить",
            Favorite: "Избранное",
            "login-btn": "Вход",
            "register-btn": "Регистрация",
            "search-btn": "Поиск",
            "search-placeholder": "Поиск телефона...",
            "language-selector": "РУС",
            "catalog-button": "Каталог",
            phone: "Телефоны",
            tablet: "Планшеты",
            headphone: "Наушники",
            "phone-accessories": "Аксессуары для телефонов",
            "search-in-more-detail": "Расширенный поиск",
            brand: "Марка",
            "all-brand": "Все марки",
            other: "Другие",
            "select-brand": "Сначала выберите марку",
            "price-range": "Диапазон цен",
            city: "Город",
            "all-city": "Все города",
            Baku: "Баку", Sumqayit: "Сумгайыт", Ganja: "Гянджа",
            Absheron: "Апшерон", Agcabedi: "Агджабеди", Agdam: "Агдам",
            Agdash: "Агдаш", Agstafa: "Агстафа", Agsu: "Агсу",
            Astara: "Астара", Balakan: "Балакен", Beylagan: "Бейляган",
            Barda: "Барда", Bilasuvar: "Билясувар", Dashkasan: "Дашкесан",
            Fuzuli: "Физули", Gadabay: "Гедабек", Goranboy: "Горанбой",
            Goychay: "Гейчай", Goygol: "Гейгёль", Hajigabul: "Хаджигабул",
            Imishli: "Имишли", Ismayilli: "Исмаиллы", Jabrayil: "Джабраил",
            Jalilabad: "Джалилабад", Kalbajar: "Кельбаджар", Kurdamir: "Кюрдамир",
            Lachin: "Лачин", Lankaran: "Ленкорань", Lerik: "Лерик",
            Masalli: "Масаллы", Mingachevir: "Мингячевир", Naftalan: "Нафталан",
            Nakhchivan: "Нахчыван", Neftchala: "Нефтчала", Oguz: "Огуз",
            Qabala: "Габала", Qakh: "Гах", Qazakh: "Казах", Quba: "Губа",
            Qubadli: "Губадлы", Qusar: "Гусар", Saatli: "Саатлы",
            Sabirabad: "Сабирабад", Salyan: "Сальян", Shabran: "Шабран",
            Shaki: "Шеки", Shamakhi: "Шемаха", Shirvan: "Ширван",
            Shusha: "Шуша", Siazan: "Сиязань", Tartar: "Тертер",
            Tovuz: "Товуз", Ujar: "Уджар", Yardimli: "Ярдымлы",
            Yevlakh: "Евлах", Zangilan: "Зангилан", Zaqatala: "Закаталы",
            Zardab: "Зардаб",
            "filter-category-label": "Категория",
            "filter-cat-all": "Все",
            "filter-cat-phone": "Телефоны",
            "filter-cat-tablet": "Планшеты",
            "filter-cat-headphone": "Наушники",
            "filter-cat-accessory": "Аксессуары",
            "filter-memory-label": "Память (ROM)",
            "filter-ram-label": "Оперативная память (RAM)",
            "ram-2gb": "2 ГБ",
            "ram-4gb": "4 ГБ",
            "ram-6gb": "6 ГБ",
            "ram-8gb": "8 ГБ",
            "ram-12gb": "12 ГБ",
            "ram-16gb": "16 ГБ+",
            "filter-screen-label": "Размер экрана",
            "screen-small": "Меньше 5\"",
            "screen-medium": "5.1\" - 6.0\"",
            "screen-large": "6.1\" - 6.7\"",
            "screen-xlarge": "6.8\"+",
            "filter-battery-label": "Емкость аккумулятора",
            "battery-low": "Меньше 3000 мАч",
            "battery-mid": "3000 - 4500 мАч",
            "battery-high": "4500 мАч+",
            "filter-seller-label": "Тип продавца",
            "seller-private": "Частное лицо",
            "seller-store": "Магазин",
            "memory-button-below-64": "Меньше 64 ГБ",
            "memory-button-64": "64 ГБ",
            "memory-button-128": "128 ГБ",
            "memory-button-256": "256 ГБ",
            "memory-button-512": "512 ГБ",
            "memory-button-512-more": "512 ГБ и более",
            "finger-print-sensors": "Датчик отпечатка пальца",
            "doesnt-matter": "Неважно",
            Available: "Есть",
            "not-available": "Нет",
            "Not working": "Не работает",
            yes: "Да",
            no: "Нет",
            "Water resistance": "Водостойкость",
            "Additional memory": "Дополнительная память",
            Delivery: "Доставка",
            condition: "Состояние",
            both: "Оба",
            new: "Новый",
            used: "Б/у",
            color: "Цвет",
            white: "Белый", black: "Чёрный", grey: "Серый", blue: "Синий",
            red: "Красный", green: "Зелёный", yellow: "Жёлтый",
            orange: "Оранжевый", pink: "Розовый", purple: "Фиолетовый",
            brown: "Коричневый", gold: "Золотой", silver: "Серебряный",
            "apply-select": "Применить фильтры",
            "reset-btn": "Сбросить",
            "active-filters": "Активные фильтры:",
            "new-announcement": "Новое объявление",
            "vip-announcement": "VIP ОБЪЯВЛЕНИЯ",
            "all-view": "Показать все",
            "all-announcement": "ВСЕ ОБЪЯВЛЕНИЯ",
            "sort-by-date": "По дате",
            "sort-price-high": "Сначала дороже",
            "sort-price-low": "Сначала дешевле",
            faq: "Частые вопросы",
            "rules-safety": "Правила и безопасность",
            "posting-rules": "Правила размещения",
            "privacy-policy": "Политика конфиденциальности",
            "useful-links": "Полезные ссылки",
            contact: "Контакты",
            "faq-title": "Часто задаваемые вопросы",
            "faq-q1": "Размещение объявления на Mobilim.az платное?",
            "faq-a1": "Нет, стандартное размещение объявлений на нашей платформе абсолютно бесплатно. Если вы хотите, чтобы ваше объявление охватило большую аудиторию в кратчайшие сроки, вы можете воспользоваться нашими VIP-услугами.",
            "faq-q2": "Как я могу зарегистрироваться?",
            "faq-a2": "Процесс регистрации очень прост. Нажмите на кнопку Регистрация в правом верхнем углу сайта, введите номер своего мобильного телефона и создайте свой профиль за считанные секунды.",
            "faq-q3": "Как добавить новое объявление?",
            "faq-a3": "Войдите в свой личный кабинет и нажмите кнопку Новое объявление. Точно укажите характеристики вашего устройства, добавьте качественные фотографии и подтвердите. В кратчайшие сроки ваше объявление будет опубликовано.",
            "faq-q4": "Какое максимальное количество фотографий можно добавить в одно объявление?",
            "faq-a4": "В каждое объявление можно добавить до 6 фотографий в высоком качестве. Качественные снимки устройства с разных ракурсов значительно повышают вероятность быстрой продажи.",
            "faq-q5": "Когда мое объявление станет активно на сайте?",
            "faq-a5": "После публикации объявление проходит короткий процесс модерации на соответствие стандартам. Если нет нарушений, оно появляется на сайте в течение нескольких минут.",
            "faq-q6": "Как связаться с продавцом устройства, которое мне понравилось?",
            "faq-a6": "Контактный номер продавца указан в нижней части каждого объявления. Вы можете связаться с ним напрямую, используя кнопку Позвонить или Написать сообщение.",
            "faq-q7": "Могу ли я внести изменения в свое объявление?",
            "faq-a7": "Да, вы можете изменить любое свое объявление, зайдя в раздел Мои объявления в личном кабинете. После редактирования объявление повторно пройдет короткую модерацию.",
            "faq-q8": "Сколько дней объявления остаются активными на сайте?",
            "faq-a8": "Каждое объявление, размещенное на нашей платформе, остается активным в течение 30 дней. По истечении этого срока объявление автоматически переносится в архив и может быть восстановлено по вашему желанию.",
            "faq-q9": "Что делать, если я столкнулся с подозрительным объявлением или нарушением правил?",
            "faq-a9": "Безопасность наших пользователей является нашим главным приоритетом. Если вы заметили подозрительное объявление, пожалуйста, сообщите нам об этом, нажав кнопку Пожаловаться на странице объявления.",
            "faq-q10": "В чем преимущества VIP-объявлений?",
            "faq-a10": "VIP-объявления всегда находятся в первых строках результатов поиска, выделяются особым дизайном и отображаются на главной странице. Это помогает продать ваше устройство в десятки раз быстрее.",
            "login-title": "Вход в аккаунт",
            "login-facebook": "С Facebook",
            "login-google": "С Google",
            "login-or": "или",
            "login-username-placeholder": "Имя пользователя или email",
            "login-password-placeholder": "Пароль",
            "login-remember": "Запомнить меня",
            "login-forgot": "Забыли пароль?",
            "login-submit": "Войти",
            "login-no-account": "Нет аккаунта?",
            "login-signup-link": "Зарегистрироваться",
            "signup-title": "Регистрация",
            "signup-firstname-placeholder": "Имя",
            "signup-lastname-placeholder": "Фамилия",
            "signup-email-placeholder": "Адрес электронной почты",
            "signup-phone-placeholder": "Номер телефона",
            "signup-confirm-password-placeholder": "Подтвердите пароль",
            "signup-terms-agree": "Я согласен с",
            "signup-terms": "Условиями использования",
            "signup-privacy": "Политикой конфиденциальности",
            "signup-and": "и",
            "signup-has-account": "Уже есть аккаунт?",
            "signup-login-link": "Войти",
            "about-page-title": "О нас - Mobilim.az",
            "about-h1": "Mobilim.az — Новая и надежная торговая платформа мобильных устройств в Азербайджане",
            "about-sub": "Специализированный маркетплейс мобильных устройств и аксессуаров",
            "about-p1": "В секторе электронной коммерции Азербайджана платформа <b style=\"color: blueviolet;\">Mobilim.az</b> специализируется на смартфонах, планшетах, наушниках и мобильных аксессуарах. Узкая направленность на мобильные технологии создает быструю, безопасную и удобную среду для покупателей и продавцов.",
            "about-p2": "На нашей платформе как частные лица, так и магазины могут легко покупать и продавать новые и б/у устройства и аксессуары.",
            "about-p3": "Объединяя широкий ассортимент на любой бюджет, Mobilim.az прозрачно отображает технические характеристики, цены и состояние (новый/б/у), делая подбор устройства максимально простым.",
            "about-h2-1": "Какие товары представлены на Mobilim.az?",
            "about-ul1-1": "Новые и б/у смартфоны всех брендов и ценовых категорий",
            "about-ul1-2": "Планшеты от Apple, Samsung, Xiaomi и других производителей",
            "about-ul1-3": "Проводные и беспроводные наушники, аудиоаксессуары",
            "about-ul1-4": "Адаптеры, защитные чехлы, защитные стекла и другие аксессуары",
            "about-category-summary": "И покупатели, и продавцы легко решают свои задачи на Mobilim.az. Размещайте объявления бесплатно и находите клиентов.",
            "about-h2-2": "Почему именно Mobilim.az?",
            "about-ul2-1": "Специализированный рынок: Экосистема для смартфонов, планшетов, наушников и мобильных аксессуаров.",
            "about-ul2-2": "Удобный поиск и фильтры: Быстрый подбор моделей с фильтрами по категории, марке, цене и состоянию.",
            "about-ul2-3": "Надежная торговая среда: Прозрачный рейтинг и реальные отзывы покупателей о продавцах и магазинах.",
            "about-ul2-4": "Гибкие пакеты объявлений: Пакеты Стандарт, PRO и VIP для эффективного продвижения объявлений.",
            "about-h2-3": "Как работает Mobilim.az?",
            "about-p4": "Наша платформа создает удобную и безопасную среду для индивидуальных продавцов и магазинов.",
            "about-h3-1": "1. Для частных продавцов",
            "about-ul3-1": "Быстрая продажа: Размещайте устройства или аксессуары бесплатно или с пакетами продвижения.",
            "about-ul3-2": "Прямая связь: Быстрое общение с покупателями через внутренние сообщения или по телефону.",
            "about-ul3-3": "Точный поиск: Покупатели легко находят объявления по категориям, брендам, состоянию и цене.",
            "about-h3-2": "2. Для магазинов",
            "about-ul4-1": "Профиль магазина: Магазины электроники могут зарегистрироваться и открыть свою витрину.",
            "about-ul4-2": "Управление и продвижение: Панель управления магазином и возможности продвижения объявлений PRO/VIP.",
            "about-ul4-3": "Целевая аудитория: Показ ассортимента покупателям, заинтересованным именно в мобильной технике.",
            "about-h2-4": "Планы на будущее и развитие",
            "about-ul5-1": "Мобильное приложение (в планах): Запуск приложений для iOS и Android для удобной публикации и поиска.",
            "about-ul5-2": "Интеграция искусственного интеллекта (в планах): Умные рекомендации и улучшенный поиск на базе машинного обучения.",
            "about-ul5-3": "Автоматическая модерация (в планах): Алгоритмы выявления подозрительных объявлений (в настоящее время объявления проверяются модераторами).",
            "about-p5": "Mobilim.az — специализированная платформа, делающая покупку и продажу смартфонов, планшетов, наушников и аксессуаров в Азербайджане простой и надежной.",
            "about-tagline": "Mobilim.az — Надежный центр торговли мобильной техникой.",
            "stores-h1": "Откройте для себя любимые магазины",
            "stores-p": "Мы собрали для вас лучшие магазины",
            "stores-search-placeholder": "Поиск магазина...",
            "stores-search-btn": "Поиск",
            "stores-add-btn": "Открыть магазин",
            "stores-view-btn": "В магазин",
            "stores-contact-btn": "Контакт",
            "phone-h2": "Модели телефонов",
            "elan-h2": "Разместить новое объявление",
            "elan-category": "Категория",
            "elan-brand": "Марка",
            "elan-model": "Модель",
            "elan-model-placeholder": "Напр.: iPhone 14 Pro",
            "elan-city": "Город",
            "elan-price": "Цена (AZN)",
            "elan-condition": "Состояние",
            "elan-memory": "Память (ГБ)",
            "elan-color": "Цвет",
            "elan-fingerprint": "Датчик отпечатка пальца",
            "elan-nfc": "NFC",
            "elan-waterproof": "Водонепроницаемость",
            "elan-expandable": "Доп. память",
            "elan-delivery": "Доставка",
            "elan-desc": "Описание (Подробная информация)",
            "elan-desc-placeholder": "Общее состояние телефона, почему продается и т.д.",
            "elan-images": "Загрузить фото",
            "elan-images-small": "Мин 1, макс 10 фото. Макс 5МБ каждое.",
            "elan-phone": "Контактный номер",
            "elan-phone-placeholder": "+994 XX XXX XX XX",
            "elan-submit": "Разместить",
            "elan-rules-h3": "Правила",
            "elan-rule1": "Срок действия объявления - 30 дней.",
            "elan-rule2": "Не подавайте одно и то же объявление несколько раз.",
            "elan-rule3": "Опишите свой товар как можно подробнее.",
            "elan-rule4": "Не пишите цену в заголовке - для этого есть отдельное место.",
            "elan-rule5": "Вся информация о вашем объявлении отправляется на ваш адрес электронной почты.",
            "elan-rule6": "Не указывайте телефон, электронную почту и адрес сайта в описании и на фотографиях.",
            "elan-rule7": "Используйте фактическое описание товара и картинку.",
            "elan-rule8": "Фотографии должны быть качественными.",
            "elan-rule9": "В каждой категории есть свой лимит.",
            "elan-rule10": "Если у товара есть гарантия, это следует отметить в разделе описания.",
            "elan-rule11": "Соблюдайте этические правила при размещении объявления.",
            "elan-select": "Выбрать",
            "fav-h1": "Избранное",
            "fav-empty-p": "Объявления еще не добавлены в избранное.",
            "fav-empty-a": "Посмотреть объявления",
            "cabinet-title": "Личный кабинет",
            "cab-profile": "Профиль",
            "cab-my-ads": "Мои объявления",
            "cab-messages": "Сообщения",
            "cab-settings": "Настройки",
            "cab-logout": "Выйти",
            "cab-welcome": "Добро пожаловать,",
            "cab-active-ads": "Активные объявления",
            "cab-total-views": "Всего просмотров",
            "cab-favorites": "Избранное",
            "cab-personal-info": "Личная информация",
            "cab-name-lbl": "Имя:",
            "cab-surname-lbl": "Фамилия:",
            "cab-phone-lbl": "Телефон:",
            "cab-email-lbl": "Эл. почта:",
            "cab-edit-btn": "Редактировать",
            "cab-standard-acc": "Стандартный аккаунт",
            "cab-dashboard": "Панель управления",
            "cab-dashboard-desc": "Добро пожаловать. Ознакомьтесь с вашей статистикой за сегодня.",
            "cab-new-ad": "Новое объявление",
            "cab-balance": "Ваш баланс",
            "cab-increase": "Пополнить",
            "cab-buy-package": "Купить пакет",
            "cab-total-views-month": "Всего просмотров (за месяц)",
            "cab-wa-clicks": "Переходы в WhatsApp",
            "cab-recent-activity": "Последняя активность",
            "cab-ref-bonus": "Реферальный бонус",
            "cab-ref-bonus-desc": "Вы получили 5 AZN, потому что ваш друг \"Гасан А.\" зарегистрировался.",
            "cab-sys-login": "Вход в систему",
            "cab-sys-login-desc": "Обнаружен новый вход в ваш аккаунт (Баку, 192.168.1.1)",
            "cab-my-ads-desc": "Управляйте всеми вашими активными и неактивными объявлениями.",
            "cab-filter-all": "Все объявления",
            "cab-filter-active": "Активные",
            "cab-filter-pending": "На проверке",
            "cab-filter-expired": "Истекшие",
            "cab-messages-desc": "Связь с покупателями и продавцами",
            "cab-search-msg": "Поиск сообщений...",
            "cab-msg-empty": "Ваш почтовый ящик пуст.",
            "cab-no-user": "Пользователь не выбран",
            "cab-select-msg": "Выберите сообщение слева, чтобы начать чат",
            "cab-write-msg": "Напишите сообщение...",
            "cab-settings-desc": "Управляйте информацией своего аккаунта",
            "cab-notifications": "Уведомления",
            "cab-security": "Безопасность",
            "cab-privacy": "Конфиденциальность",
            "cab-name": "Имя",
            "cab-surname": "Фамилия",
            "cab-email": "Email",
            "cab-phone": "Телефон",
            "cab-save": "Сохранить",
            "cab-notif-desc": "Выберите, какую информацию и каким способом вы хотите получать от платформы.",
            "cab-email-notifs": "Email-уведомления",
            "cab-new-msgs": "Новые сообщения",
            "cab-new-msgs-desc": "Сразу получайте email, когда кто-то пишет вам как покупатель или продавец",
            "cab-ad-status": "Статус объявления",
            "cab-ad-status-desc": "Когда ваше объявление одобрено, отклонено или срок его действия истек",
            "cab-news-camp": "Новости и кампании",
            "cab-news-camp-desc": "Новости, скидки и специальные предложения от Mobilim.az",
            "cab-curr-pass": "Текущий пароль",
            "cab-new-pass": "Новый пароль",
            "cab-2fa": "Включить двухфакторную аутентификацию (2FA)",
            "cab-update": "Обновить",
            "cab-acc-manage": "Управление аккаунтом",
            "cab-freeze-acc": "Заморозить аккаунт",
            "cab-freeze-desc": "Ваш аккаунт и все активные объявления будут временно скрыты.",
            "cab-freeze-btn": "Заморозить",
            "cab-del-acc": "Удалить аккаунт",
            "cab-del-desc": "Все ваши данные и объявления будут удалены навсегда. Это действие нельзя отменить.",
            "cab-del-btn": "Удалить аккаунт",
            "cab-priv-desc": "Управляйте тем, как ваша информация отображается на платформе.",
            "cab-show-num": "Показывать номер",
            "cab-show-num-desc": "Показывать ваш контактный номер во всех объявлениях",
            "cab-allow-msg": "Разрешить сообщения",
            "cab-allow-msg-desc": "Разрешить другим пользователям писать вам через внутреннюю систему",
            "cab-online-status": "Онлайн-статус",
            "cab-online-desc": "Показывать, когда вы были в сети, в вашем профиле",
            "cab-social-title": "Социальные аккаунты",
            "cab-social-desc": "Подключите свои аккаунты соцсетей для более быстрого и безопасного входа.",
            "cab-unlinked": "Не подключено",
            "cab-link": "Подключить",
            "cab-billing": "Пакеты и платежи",
            "cab-curr-pkg": "Текущий пакет",
            "cab-no-pkg": "Активных пакетов нет.",
            "cab-pay-hist": "История платежей",
            "cab-no-trans": "Операции не найдены.",
            "mon-referral-title": "Пригласи друга и заработай 5 AZN!",
            "mon-referral-desc": "За каждого приглашенного друга, который зарегистрируется, на ваш баланс будет начислено 5 AZN.",
            "mon-referral-credit": "Реферальный баланс",
            "mon-copy-link": "Копировать",
            "mon-promote-ad": "Продвигать",
            "mon-bump": "Поднять вверх",
            "mon-vip": "VIP",
            "mon-pro": "PRO",
            "mon-duration": "Срок:",
            "mon-use-credit": "Использовать реферальный кредит (макс. 50%)",
            "mon-total": "Итого:",
            "mon-pay-btn": "Оплатить",
            // Rules page
            "rules-page-h1": "Правила и безопасность",
            "rules-page-sub": "Прочитайте эти правила, чтобы безопасно и удобно пользоваться нашей платформой.",
            "rules-tab-general": "Общие правила",
            "rules-tab-posting": "Размещение объявлений",
            "rules-tab-safety": "Безопасность",
            "rules-tab-prohibited": "Запрещено",
            // Privacy page
            "privacy-page-h1": "Политика конфиденциальности",
            "privacy-page-sub": "Mobilim.az считает защиту конфиденциальности пользователей принципом.",
            "privacy-updated": "Последнее обновление: Март 2025",
            "privacy-h2-collect": "Какие данные мы собираем?",
            "privacy-h2-use": "Как мы используем данные?",
            "privacy-h2-share": "Передаём ли мы данные?",
            "privacy-h2-cookies": "Файлы Cookie",
            "privacy-h2-rights": "Права пользователя",
            "privacy-h2-security": "Безопасность данных",
            "privacy-h2-changes": "Изменения в политике",
            "privacy-h2-contact": "Свяжитесь с нами",
            "det-breadcrumb-home": "Главная",
            "det-breadcrumb-phones": "Телефоны",
            "det-badge-new": "Новый",
            "det-price-note": "Цена фиксированная · Возможен бартер",
            "det-city-label": "Город:",
            "det-condition-label": "Состояние:",
            "det-delivery-label": "Доставка:",
            "det-delivery-yes": "Есть",
            "det-feat-fingerprint": "Отпечаток пальца",
            "det-feat-waterproof-chip": "Водонепроницаемый",
            "det-feat-no-expandable": "Без карты памяти",
            "det-specs-title": "Технические характеристики",
            "det-spec-storage": "Память",
            "det-spec-screen": "Экран",
            "det-spec-refresh": "Частота обновления",
            "det-spec-battery": "Аккумулятор",
            "det-spec-processor": "Процессор",
            "det-spec-cam-rear": "Основная камера",
            "det-spec-cam-front": "Фронтальная камера",
            "det-spec-color": "Цвет",
            "det-spec-condition": "Состояние",
            "det-spec-available": "В наличии",
            "det-spec-waterproof": "Водозащита",
            "det-spec-included": "В комплекте",
            "det-desc-title": "Описание",
            "det-reviews-title": "Отзывы о продавце",
            "det-write-review-title": "Оставить отзыв",
            "det-review-submit": "Отправить отзыв",
            "det-ad-no": "Номер объявления:",
            "det-posted": "Опубликовано:",
            "det-updated": "Обновлено:",
            "det-seller-personal": "Частное лицо",
            "det-btn-call": "Показать номер",
            "det-btn-whatsapp": "Написать в WhatsApp",
            "det-btn-message": "Отправить сообщение",
            "det-seller-since": "На сайте с:",
            "det-sidebar-review-title": "Оставить отзыв",
            "det-safety-title": "Безопасная сделка",
            "det-safety-1": "Встречайтесь в общественных местах",
            "det-safety-2": "Проверьте IMEI код перед покупкой",
            "det-safety-3": "Избегайте предоплаты",
            "det-safety-4": "Сообщите о подозрительном объявлении",
            "det-btn-share": "Поделиться",
            "det-btn-report": "Пожаловаться",
            "det-related-title": "Похожие объявления",
            "det-review-name-ph": "Ваше имя (напр. Али М.)",
            "det-review-text-ph": "Поделитесь опытом о продавце...",
            "det-sidebar-review-ph": "Ваш отзыв об этом продавце...",
            "det-reviews-seller-note": "Все отзывы об этом продавце",
            "det-rating-based-on": "на основе отзывов",
            "det-no-reviews": "Отзывов об этом продавце пока нет. Будьте первым!",
            "det-view-store": "Перейти в магазин",
            "footer-copyright": "© 2025 Mobilim.az. Все права защищены."
        }
    };
    const authTranslations = {
        AZ: {
            "login-btn": "Giri\u015f",
            "register-btn": "Qeydiyyat",
            "auth-login-page-title": "Giri\u015f - Mobilim.az",
            "auth-signup-page-title": "Qeydiyyat - Mobilim.az",
            "auth-welcome": "Xo\u015f g\u0259ldiniz!",
            "auth-brand-sub": "Az\u0259rbaycan\u0131n \u0259n b\u00f6y\u00fck telefon bazar\u0131na daxil olun.",
            "auth-feat-1": "SSL il\u0259 qorunan giri\u015f",
            "auth-feat-2": "S\u00fcr\u0259tli v\u0259 etibarl\u0131",
            "auth-feat-3": "50,000+ telefon elan\u0131",
            "auth-feat-4": "24/7 d\u0259st\u0259k xidm\u0259ti",
            "auth-tab-login": "Giri\u015f",
            "auth-tab-signup": "Qeydiyyat",
            "auth-heading-login": "Hesaba giri\u015f",
            "auth-subheading-login": "Hesab\u0131n\u0131za daxil olmaq \u00fc\u00e7\u00fcn \u00fcsul se\u00e7in",
            "auth-method-label": "Giri\u015f \u00fcsulu",
            "auth-method-pwd": "\u015eifr\u0259",
            "auth-method-sms": "SMS kodu",
            "auth-method-email": "Email kodu",
            "auth-or": "v\u0259 ya",
            "auth-login-id": "Email v\u0259 ya istifad\u0259\u00e7i ad\u0131",
            "auth-pwd": "\u015eifr\u0259",
            "auth-remember": "M\u0259ni xat\u0131rla",
            "auth-forgot": "\u015eifr\u0259ni unutmusunuz?",
            "auth-btn-login": "Daxil ol",
            "auth-phone": "Telefon n\u00f6mr\u0259si",
            "auth-email": "Email \u00fcnvan\u0131",
            "auth-btn-send-sms": "SMS kodu g\u00f6nd\u0259r",
            "auth-btn-send-email": "Email kodu g\u00f6nd\u0259r",
            "auth-btn-verify": "Kodu t\u0259sdiql\u0259",
            "auth-no-code": "Kodu almad\u0131n\u0131z?",
            "auth-resend": "Yenid\u0259n g\u00f6nd\u0259r",
            "auth-change-num": "\u2190 N\u00f6mr\u0259ni d\u0259yi\u015f",
            "auth-change-email": "\u2190 Email-i d\u0259yi\u015f",
            "auth-no-account": "Hesab\u0131n\u0131z yoxdur?",
            "auth-go-signup": "Qeydiyyatdan ke\u00e7in",
            "auth-sms-sent-1": "SMS kodu",
            "auth-sms-sent-2": "n\u00f6mr\u0259sin\u0259 g\u00f6nd\u0259rildi.",
            "auth-email-sent-1": "6 r\u0259q\u0259mli kod",
            "auth-email-sent-2": "\u00fcnvan\u0131na g\u00f6nd\u0259rildi.",
            "auth-ph-email": "example@email.com",
            "auth-ph-phone": "55 123 45 67",
            "auth-signup-welcome": "Qeydiyyatdan ke\u00e7in!",
            "auth-signup-brand-sub": "Pulsuz hesab yarad\u0131n, elanlar\u0131n\u0131z\u0131 d\u0259rhal d\u0259rc edin.",
            "auth-signup-feat-1": "Pulsuz elan yerl\u0259\u015fdirin",
            "auth-signup-feat-2": "Sat\u0131c\u0131larla birba\u015fa \u0259laq\u0259",
            "auth-signup-feat-3": "Se\u00e7ilmi\u015fl\u0259r\u0259 \u0259lav\u0259 edin",
            "auth-signup-feat-4": "Yeni elanlarda bildiri\u015f al\u0131n",
            "auth-heading-signup": "Hesab yarat",
            "auth-subheading-signup": "Do\u011frulama \u00fcsulunuzu se\u00e7in",
            "auth-signup-method-label": "Qeydiyyat \u00fcsulu",
            "auth-signup-method-sms": "SMS il\u0259",
            "auth-signup-method-email": "Email il\u0259",
            "auth-first-name": "Ad",
            "auth-last-name": "Soyad",
            "auth-ph-name": "\u018fli",
            "auth-ph-surname-signup": "H\u0259s\u0259nov",
            "auth-btn-verify-phone": "N\u00f6mr\u0259ni t\u0259sdiql\u0259",
            "auth-phone-verified": "N\u00f6mr\u0259niz t\u0259sdiql\u0259ndi!",
            "auth-email-optional": "Email (ist\u0259y\u0259 ba\u011fl\u0131)",
            "auth-pwd-confirm": "\u015eifr\u0259ni t\u0259sdiql\u0259",
            "auth-terms-consent": "<a href=\"#\">\u0130stifad\u0259 \u015f\u0259rtl\u0259ri</a> v\u0259 <a href=\"#\">Gizlilik siyas\u0259ti</a> il\u0259 raz\u0131yam",
            "auth-btn-create-account": "Hesab yarat",
            "auth-has-account": "Art\u0131q hesab\u0131n\u0131z var?",
            "auth-go-login": "Daxil olun",
            "auth-btn-verify-email": "Email-i t\u0259sdiql\u0259",
            "auth-email-verified": "Email-iniz t\u0259sdiql\u0259ndi!",
            "auth-phone-optional": "Telefon (ist\u0259y\u0259 ba\u011fl\u0131)",
            "auth-strength-weak": "Z\u0259if",
            "auth-strength-fair": "Orta",
            "auth-strength-good": "Yax\u015f\u0131",
            "auth-strength-strong": "G\u00fccl\u00fc"
        },
        ENG: {
            "login-btn": "Log In",
            "register-btn": "Sign Up",
            "auth-login-page-title": "Log In - Mobilim.az",
            "auth-signup-page-title": "Sign Up - Mobilim.az",
            "auth-welcome": "Welcome!",
            "auth-brand-sub": "Join Azerbaijan's largest phone marketplace.",
            "auth-feat-1": "SSL-secured login",
            "auth-feat-2": "Fast and reliable",
            "auth-feat-3": "50,000+ phone listings",
            "auth-feat-4": "24/7 support",
            "auth-tab-login": "Log In",
            "auth-tab-signup": "Sign Up",
            "auth-heading-login": "Account login",
            "auth-subheading-login": "Choose a method to sign in to your account",
            "auth-method-label": "Login method",
            "auth-method-pwd": "Password",
            "auth-method-sms": "SMS code",
            "auth-method-email": "Email code",
            "auth-or": "or",
            "auth-login-id": "Email or username",
            "auth-pwd": "Password",
            "auth-remember": "Remember me",
            "auth-forgot": "Forgot your password?",
            "auth-btn-login": "Log In",
            "auth-phone": "Phone number",
            "auth-email": "Email address",
            "auth-btn-send-sms": "Send SMS code",
            "auth-btn-send-email": "Send email code",
            "auth-btn-verify": "Verify code",
            "auth-no-code": "Didn't receive the code?",
            "auth-resend": "Resend",
            "auth-change-num": "\u2190 Change number",
            "auth-change-email": "\u2190 Change email",
            "auth-no-account": "Don't have an account?",
            "auth-go-signup": "Sign up",
            "auth-sms-sent-1": "An SMS code was sent to",
            "auth-sms-sent-2": ".",
            "auth-email-sent-1": "A 6-digit code was sent to",
            "auth-email-sent-2": ".",
            "auth-ph-email": "example@email.com",
            "auth-ph-phone": "55 123 45 67",
            "auth-signup-welcome": "Create your account!",
            "auth-signup-brand-sub": "Create a free account and publish your listings instantly.",
            "auth-signup-feat-1": "Post listings for free",
            "auth-signup-feat-2": "Contact sellers directly",
            "auth-signup-feat-3": "Add to favorites",
            "auth-signup-feat-4": "Get alerts for new listings",
            "auth-heading-signup": "Create account",
            "auth-subheading-signup": "Choose your verification method",
            "auth-signup-method-label": "Registration method",
            "auth-signup-method-sms": "By SMS",
            "auth-signup-method-email": "By email",
            "auth-first-name": "First name",
            "auth-last-name": "Last name",
            "auth-ph-name": "Ali",
            "auth-ph-surname-signup": "Hasanov",
            "auth-btn-verify-phone": "Verify phone number",
            "auth-phone-verified": "Your phone number is verified!",
            "auth-email-optional": "Email (optional)",
            "auth-pwd-confirm": "Confirm password",
            "auth-terms-consent": "I agree to the <a href=\"#\">Terms of Use</a> and <a href=\"#\">Privacy Policy</a>",
            "auth-btn-create-account": "Create account",
            "auth-has-account": "Already have an account?",
            "auth-go-login": "Log in",
            "auth-btn-verify-email": "Verify email",
            "auth-email-verified": "Your email is verified!",
            "auth-phone-optional": "Phone (optional)",
            "auth-strength-weak": "Weak",
            "auth-strength-fair": "Fair",
            "auth-strength-good": "Good",
            "auth-strength-strong": "Strong"
        },
        RUS: {
            "login-btn": "\u0412\u043e\u0439\u0442\u0438",
            "register-btn": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
            "auth-login-page-title": "\u0412\u0445\u043e\u0434 - Mobilim.az",
            "auth-signup-page-title": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f - Mobilim.az",
            "auth-welcome": "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c!",
            "auth-brand-sub": "\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u043d\u0430 \u043a\u0440\u0443\u043f\u043d\u0435\u0439\u0448\u0438\u0439 \u0440\u044b\u043d\u043e\u043a \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u043e\u0432 \u0410\u0437\u0435\u0440\u0431\u0430\u0439\u0434\u0436\u0430\u043d\u0430.",
            "auth-feat-1": "\u0412\u0445\u043e\u0434 \u0441 \u0437\u0430\u0449\u0438\u0442\u043e\u0439 SSL",
            "auth-feat-2": "\u0411\u044b\u0441\u0442\u0440\u043e \u0438 \u043d\u0430\u0434\u0435\u0436\u043d\u043e",
            "auth-feat-3": "50,000+ \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0439 \u043e \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430\u0445",
            "auth-feat-4": "\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 24/7",
            "auth-tab-login": "\u0412\u0445\u043e\u0434",
            "auth-tab-signup": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
            "auth-heading-login": "\u0412\u0445\u043e\u0434 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
            "auth-subheading-login": "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431 \u0432\u0445\u043e\u0434\u0430 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
            "auth-method-label": "\u0421\u043f\u043e\u0441\u043e\u0431 \u0432\u0445\u043e\u0434\u0430",
            "auth-method-pwd": "\u041f\u0430\u0440\u043e\u043b\u044c",
            "auth-method-sms": "SMS-\u043a\u043e\u0434",
            "auth-method-email": "Email-\u043a\u043e\u0434",
            "auth-or": "\u0438\u043b\u0438",
            "auth-login-id": "Email \u0438\u043b\u0438 \u0438\u043c\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f",
            "auth-pwd": "\u041f\u0430\u0440\u043e\u043b\u044c",
            "auth-remember": "\u0417\u0430\u043f\u043e\u043c\u043d\u0438\u0442\u044c \u043c\u0435\u043d\u044f",
            "auth-forgot": "\u0417\u0430\u0431\u044b\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c?",
            "auth-btn-login": "\u0412\u043e\u0439\u0442\u0438",
            "auth-phone": "\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
            "auth-email": "Email-\u0430\u0434\u0440\u0435\u0441",
            "auth-btn-send-sms": "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c SMS-\u043a\u043e\u0434",
            "auth-btn-send-email": "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c email-\u043a\u043e\u0434",
            "auth-btn-verify": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u043a\u043e\u0434",
            "auth-no-code": "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u0438 \u043a\u043e\u0434?",
            "auth-resend": "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0435\u0449\u0435 \u0440\u0430\u0437",
            "auth-change-num": "\u2190 \u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043d\u043e\u043c\u0435\u0440",
            "auth-change-email": "\u2190 \u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c email",
            "auth-no-account": "\u041d\u0435\u0442 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430?",
            "auth-go-signup": "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c",
            "auth-sms-sent-1": "SMS-\u043a\u043e\u0434 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d \u043d\u0430",
            "auth-sms-sent-2": ".",
            "auth-email-sent-1": "6-\u0437\u043d\u0430\u0447\u043d\u044b\u0439 \u043a\u043e\u0434 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d \u043d\u0430",
            "auth-email-sent-2": ".",
            "auth-ph-email": "example@email.com",
            "auth-ph-phone": "55 123 45 67",
            "auth-signup-welcome": "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c!",
            "auth-signup-brand-sub": "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0430\u043a\u043a\u0430\u0443\u043d\u0442 \u0438 \u0441\u0440\u0430\u0437\u0443 \u043f\u0443\u0431\u043b\u0438\u043a\u0443\u0439\u0442\u0435 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f.",
            "auth-signup-feat-1": "\u0420\u0430\u0437\u043c\u0435\u0449\u0430\u0439\u0442\u0435 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e",
            "auth-signup-feat-2": "\u0421\u0432\u044f\u0437\u044c \u0441 \u043f\u0440\u043e\u0434\u0430\u0432\u0446\u0430\u043c\u0438 \u043d\u0430\u043f\u0440\u044f\u043c\u0443\u044e",
            "auth-signup-feat-3": "\u0414\u043e\u0431\u0430\u0432\u043b\u044f\u0439\u0442\u0435 \u0432 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435",
            "auth-signup-feat-4": "\u041f\u043e\u043b\u0443\u0447\u0430\u0439\u0442\u0435 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043e \u043d\u043e\u0432\u044b\u0445 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f\u0445",
            "auth-heading-signup": "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
            "auth-subheading-signup": "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f",
            "auth-signup-method-label": "\u0421\u043f\u043e\u0441\u043e\u0431 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438",
            "auth-signup-method-sms": "\u041f\u043e SMS",
            "auth-signup-method-email": "\u041f\u043e email",
            "auth-first-name": "\u0418\u043c\u044f",
            "auth-last-name": "\u0424\u0430\u043c\u0438\u043b\u0438\u044f",
            "auth-ph-name": "\u0410\u043b\u0438",
            "auth-ph-surname-signup": "\u0413\u0430\u0441\u0430\u043d\u043e\u0432",
            "auth-btn-verify-phone": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u043d\u043e\u043c\u0435\u0440",
            "auth-phone-verified": "\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d!",
            "auth-email-optional": "Email (\u043f\u043e \u0436\u0435\u043b\u0430\u043d\u0438\u044e)",
            "auth-pwd-confirm": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c",
            "auth-terms-consent": "\u042f \u0441\u043e\u0433\u043b\u0430\u0441\u0435\u043d \u0441 <a href=\"#\">\u0423\u0441\u043b\u043e\u0432\u0438\u044f\u043c\u0438 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f</a> \u0438 <a href=\"#\">\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u043e\u0439 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438</a>",
            "auth-btn-create-account": "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
            "auth-has-account": "\u0423\u0436\u0435 \u0435\u0441\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442?",
            "auth-go-login": "\u0412\u043e\u0439\u0442\u0438",
            "auth-btn-verify-email": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c email",
            "auth-email-verified": "Email \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d!",
            "auth-phone-optional": "\u0422\u0435\u043b\u0435\u0444\u043e\u043d (\u043f\u043e \u0436\u0435\u043b\u0430\u043d\u0438\u044e)",
            "auth-strength-weak": "\u0421\u043b\u0430\u0431\u044b\u0439",
            "auth-strength-fair": "\u0421\u0440\u0435\u0434\u043d\u0438\u0439",
            "auth-strength-good": "\u0425\u043e\u0440\u043e\u0448\u0438\u0439",
            "auth-strength-strong": "\u041d\u0430\u0434\u0435\u0436\u043d\u044b\u0439"
        }
    };
    for (const lang of Object.keys(authTranslations)) {
        Object.assign(translations[lang], authTranslations[lang]);
    }
    translations.RU = translations.RUS;
    translations.EN = translations.ENG;
    window.translations = translations;

    // ─── LANGUAGE SWITCHER ────────────────────────────────────────────────────
    function setupLanguageSwitcher() {
        const langSwitcher = document.querySelector(".language-selector");
        const currentLangElement = document.getElementById("current-lang");

        if (langSwitcher && !langSwitcher.dataset.langListenerAttached) {
            langSwitcher.dataset.langListenerAttached = "true";
            langSwitcher.addEventListener("click", changeLanguage);
        }

        function changeLanguage(forcedLang) {
            const currentLangElem = document.getElementById("current-lang");
            let newLang = forcedLang && typeof forcedLang === 'string' ? forcedLang.trim().toUpperCase() : null;
            if (newLang === 'RU') newLang = 'RUS';
            if (newLang === 'EN') newLang = 'ENG';
            if (!newLang) {
                let currentLang = currentLangElem ? currentLangElem.innerText.trim().toUpperCase() : "AZ";
                // Normalise RUS display label back to key
                if (currentLang === "РУС" || currentLang === "RU")
                    currentLang = "RUS";
                else if (currentLang === "EN")
                    currentLang = "ENG";
                newLang = currentLang === "AZ" ? "ENG" : currentLang === "ENG" ? "RUS" : "AZ";
            }

            const dict = translations[newLang] || (newLang.includes('RU') ? translations.RUS : translations.AZ);

            if (currentLangElem && dict && dict["language-selector"]) {
                currentLangElem.innerText = dict["language-selector"];
            }
            localStorage.setItem("lang", newLang);
            document.documentElement.lang = newLang === "ENG" ? "en" : (newLang === "RUS" || newLang === "RU") ? "ru" : "az";

            document.querySelectorAll("[data-translate]").forEach((element) => {
                if (!element) return;
                let key = element.getAttribute("data-translate");
                if (!key || !translations[newLang] || !translations[newLang][key])
                    return;
                if (element.tagName === "LI") {
                    const link = element.querySelector("a, span");
                    if (link) {
                        const icon = link.querySelector("i");
                        link.innerHTML = icon
                            ? icon.outerHTML + " " + translations[newLang][key]
                            : translations[newLang][key];
                    }
                }
                else if (element.tagName === "OPTION") {
                    const text = translations[newLang][key];
                    if (text) element.textContent = text;
                }
                else if (element.classList.contains("login-btn") ||
                    element.classList.contains("register-btn")) {
                    const icon = element.querySelector("i");
                    element.innerHTML = icon
                        ? icon.outerHTML + " " + translations[newLang][key]
                        : translations[newLang][key];
                }
                else {
                    const text = translations[newLang][key];
                    if (text && text.includes("<") && text.includes(">")) {
                        element.innerHTML = text;
                    }
                    else if (text) {
                        const icon = element.querySelector("i");
                        if (icon) {
                            element.innerHTML = icon.outerHTML + " " + text;
                        } else {
                            element.textContent = text;
                        }
                    }
                }
            });
            document.querySelectorAll("select option[data-translate]").forEach((option) => {
                const key = option.getAttribute("data-translate");
                const localized = translations[newLang] && translations[newLang][key];
                if (localized) option.textContent = localized;
            });
            const searchInput = document.querySelector(".search-options input");
            if (searchInput && translations[newLang] && translations[newLang]["search-placeholder"]) {
                searchInput.placeholder = translations[newLang]["search-placeholder"];
            }
            // Logic for placeholder attributes and select list text
            document.querySelectorAll("[data-translate-placeholder]").forEach((el) => {
                let element = el;
                if (!element) return;
                let key = element.getAttribute("data-translate-placeholder");
                if (key && translations[newLang] && translations[newLang][key]) {
                    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
                        if ("placeholder" in element) {
                            element.placeholder = translations[newLang][key];
                        }
                        if (element.tagName === "SELECT") {
                            const selectEl = element;
                            const firstOption = selectEl.options[0];
                            if (firstOption && firstOption.disabled) {
                                firstOption.textContent = translations[newLang][key];
                            }
                        }
                    }
                }
            });
            // Also update document.title
            const titleElements = document.querySelectorAll("[data-translate-title]");
            titleElements.forEach(el => {
                if (!el) return;
                let key = el.getAttribute("data-translate-title");
                if (key && translations[newLang] && translations[newLang][key]) {
                    document.title = translations[newLang][key];
                }
            });
            // Translate city/region dropdown options across all pages
            if (window.MobilazI18n && typeof window.MobilazI18n.translateCity === "function") {
                document.querySelectorAll('select[data-filter="city"] option, select#city option, select#shopCity option, select[name="city"] option, select[name="region"] option').forEach((opt) => {
                    if (!opt || !opt.value) return;
                    if (!opt.dataset.rawCity) opt.dataset.rawCity = opt.textContent.trim();
                    opt.textContent = window.MobilazI18n.translateCity(opt.dataset.rawCity, newLang);
                });
            }
            document.dispatchEvent(new CustomEvent("mobilaz:languagechange", { detail: { lang: newLang } }));
        }

        window.changeLanguage = changeLanguage;
        window.applyLanguage = () => changeLanguage(localStorage.getItem("lang") || "AZ");

        // Restore saved language on page load
        let savedLang = localStorage.getItem("lang");
        if (savedLang) {
            savedLang = savedLang.trim().toUpperCase();
            if (savedLang === 'RU') savedLang = 'RUS';
            if (savedLang === 'EN') savedLang = 'ENG';
            if (savedLang !== "AZ") {
                changeLanguage(savedLang);
            }
        }
    }

    setupLanguageSwitcher();
    document.addEventListener('componentsLoaded', function () {
        setupLanguageSwitcher();
    });

    // ─── FILTER TOGGLE ────────────────────────────────────────────────────────
    const filterToggle = document.getElementById("filterToggle") || document.querySelector(".filter-toggle");
    const filterBody = document.getElementById("filterBody") || document.getElementById("filterPanel");
    if (filterToggle && filterBody) {
        filterToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            filterBody.classList.toggle("active");
            filterBody.classList.toggle("open");
        });
    }

    const mobileClose = document.getElementById("mobileFilterClose") || document.querySelector(".mobile-filter-close");
    if (mobileClose && filterBody) {
        mobileClose.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            filterBody.classList.remove("active");
            filterBody.classList.remove("open");
        });
    }

    // ─── NEW AD BUTTON ────────────────────────────────────────────────────────
    const newAdBtn = document.getElementById("newAdBtn");
    if (newAdBtn) {
        newAdBtn.addEventListener("click", function () {
            window.location.href = "elan-yerlesdir.html";
        });
    }

    // ─── FILTER BUTTON GROUPS ─────────────────────────────────────────────────
    const buttonGroups = document.querySelectorAll(".memory-buttons, .fingerprint-buttons, .nfc-buttons, .waterproof-buttons, .expandable-buttons, .delivery-buttons, .condition-buttons, .color-buttons");
    if (buttonGroups && buttonGroups.length > 0) {
        buttonGroups.forEach((group) => {
            if (!group) return;
            const buttons = group.querySelectorAll("button");
            if (buttons && buttons.length > 0) {
                buttons.forEach((button) => {
                    if (!button) return;
                    button.addEventListener("click", function () {
                        buttons.forEach((btn) => btn?.classList.remove("active"));
                        this.classList.add("active");
                    });
                });
            }
        });
    }
    // ─── SORTING ──────────────────────────────────────────────────────────────
    const sortingSelect = document.getElementById("sortingOptions");
    if (sortingSelect) {
        sortingSelect.addEventListener("change", function () {
            const val = sortingSelect.value;
            try {
                const url = new URL(window.location.href);
                url.searchParams.set("sort", val);
                url.searchParams.set("sortBy", val);
                window.history.replaceState({}, "", url.toString());
            } catch (e) {}
            sortAds(val);
        });
    }
    function sortAds(sortType) {
        const adsContainer = document.getElementById("phone-ads-container") || document.querySelector(".all-ads-container");
        if (!adsContainer)
            return;
        const ads = Array.from(adsContainer.children);

        const getCardPrice = (card) => {
            const rawAttr = card.getAttribute("data-price") || card.dataset?.price;
            if (rawAttr !== undefined && rawAttr !== null && rawAttr !== "") {
                const parsed = Number(rawAttr);
                if (!isNaN(parsed)) return parsed;
            }
            const text = card.querySelector(".ad-price")?.textContent || "";
            // Remove non-numeric characters (handles thousands separator like 1.200 AZN)
            return Number(text.replace(/[^0-9]/g, "")) || 0;
        };

        const getCardDate = (card) => {
            const rawAttr = card.getAttribute("data-date") || card.dataset?.date;
            if (rawAttr) {
                const d = new Date(rawAttr).getTime();
                if (!isNaN(d)) return d;
            }
            return 0;
        };

        ads.sort((a, b) => {
            const cardA = a.querySelector(".elan-card, .ad-card") || a;
            const cardB = b.querySelector(".elan-card, .ad-card") || b;
            const priceA = getCardPrice(cardA);
            const priceB = getCardPrice(cardB);
            const dateA = getCardDate(cardA);
            const dateB = getCardDate(cardB);

            if (sortType === "date" || sortType === "date_desc" || sortType === "newest") {
                return dateB - dateA;
            }
            else if (sortType === "date_asc" || sortType === "oldest") {
                return dateA - dateB;
            }
            else if (sortType === "price-high" || sortType === "price_desc") {
                return priceB - priceA;
            }
            else if (sortType === "price-low" || sortType === "price_asc") {
                return priceA - priceB;
            }
            return 0;
        });
        adsContainer.innerHTML = "";
        ads.forEach((ad) => adsContainer.appendChild(ad));
    }
    window.sortAds = sortAds;

    // ─── SOCIAL ICONS FONTAWESOME FALLBACK ─────────────────────────────────────
    setTimeout(() => {
        const testIcon = document.querySelector('.social.whatsapp i');
        if (testIcon) {
            const beforeContent = window.getComputedStyle(testIcon, ':before').content;
            if (!beforeContent || beforeContent === 'none' || beforeContent === '""') {
                const fallbacks = { whatsapp: 'WA', instagram: 'IG', tiktok: 'TT', youtube: 'YT' };
                document.querySelectorAll('.social').forEach(link => {
                    Object.keys(fallbacks).forEach(key => {
                        if (link.classList.contains(key) && !link.textContent.trim()) {
                            link.innerHTML = `<span style="font-size:12px;font-weight:700;letter-spacing:-0.5px;">${fallbacks[key]}</span>`;
                        }
                    });
                });
            }
        }
    }, 600);

    // ─── CATALOG DROPDOWN CLOSE ON OUTSIDE CLICK ─────────────────────────────
    const catBtn = document.getElementById("catalogBtn") || document.querySelector(".catalog-button, .catalog-btn, .btn-katalog");
    const catDd = document.getElementById("catalogDropdown") || document.querySelector(".catalog-menu");
    if (catBtn && catDd) {
        catBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            catDd.classList.toggle("hidden");
            catDd.classList.toggle("active");
            catDd.classList.toggle("open");
            catBtn.style.display = 'inline-flex';
            catBtn.style.visibility = 'visible';
            catBtn.style.opacity = '1';
            if (!catDd.dataset.loaded) {
                if (typeof window.loadCatalog === "function") {
                    window.loadCatalog();
                }
                catDd.dataset.loaded = "1";
            }
        });
    }

    document.addEventListener("click", function (e) {
        const dd = document.getElementById("catalogDropdown") || document.querySelector(".catalog-menu");
        const btn = document.getElementById("catalogBtn") || document.querySelector(".catalog-button, .catalog-btn, .btn-katalog");
        if (dd && !dd.contains(e.target) && (!btn || !btn.contains(e.target))) {
            dd.classList.add("hidden");
            dd.classList.remove("active");
            dd.classList.remove("open");
        }
        if (btn) {
            btn.style.display = 'inline-flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
        }
    });

    // ─── HAMBURGER MENU TOGGLE (MOBILE) ──────────────────────────────────────
    const hamburgerBtn = document.querySelector(".hamburger") || document.getElementById("hamburgerBtn");
    const headerRight = document.querySelector(".header-right");
    if (hamburgerBtn && headerRight) {
        hamburgerBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const isOpen = headerRight.classList.toggle("open");
            headerRight.classList.toggle("active", isOpen);
            headerRight.classList.toggle("hidden", !isOpen);
            hamburgerBtn.classList.toggle("active", isOpen);
            hamburgerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        document.addEventListener("click", function (e) {
            if (window.innerWidth <= 768 && !headerRight.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                headerRight.classList.remove("open");
                headerRight.classList.remove("active");
                headerRight.classList.add("hidden");
                hamburgerBtn.classList.remove("active");
                hamburgerBtn.setAttribute("aria-expanded", "false");
            }
        });

        headerRight.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                if (window.innerWidth <= 768) {
                    headerRight.classList.remove("open");
                    headerRight.classList.remove("active");
                    headerRight.classList.add("hidden");
                    hamburgerBtn.classList.remove("active");
                    hamburgerBtn.setAttribute("aria-expanded", "false");
                }
            });
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 768) {
                headerRight.classList.remove("hidden");
                headerRight.classList.remove("open");
            }
        });
    }

    // ─── FAVORITE BUTTON HANDLER ─────────────────────────────────────────────
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem("mobilaz_favorites") || "[]");
        } catch (e) {
            return [];
        }
    }

    function saveFavorites(favs) {
        try {
            localStorage.setItem("mobilaz_favorites", JSON.stringify(favs));
        } catch (e) {}
    }

    function updateFavoriteButtons() {
        const favs = getFavorites();
        document.querySelectorAll(".favorite-btn").forEach((btn) => {
            const card = btn.closest(".elan-card, .ad-card, [data-id]");
            const id = card ? card.getAttribute("data-id") : null;
            const icon = btn.querySelector("i");
            if (!icon) return;
            if (id && favs.includes(id)) {
                icon.classList.remove("far");
                icon.classList.add("fas");
                btn.classList.add("favorited");
            } else if (id) {
                icon.classList.remove("fas");
                icon.classList.add("far");
                btn.classList.remove("favorited");
            }
        });
    }

    document.addEventListener("click", function (e) {
        const favBtn = e.target.closest(".favorite-btn");
        if (!favBtn) return;

        e.preventDefault();
        e.stopPropagation();

        const icon = favBtn.querySelector("i");
        if (!icon) return;

        const card = favBtn.closest(".elan-card, .ad-card, [data-id]");
        const id = card ? card.getAttribute("data-id") : null;
        let favs = getFavorites();

        const isFavorited = icon.classList.contains("fas");
        if (isFavorited) {
            icon.classList.remove("fas");
            icon.classList.add("far");
            favBtn.classList.remove("favorited");
            if (id) {
                favs = favs.filter((favId) => favId !== id);
                saveFavorites(favs);
            }
        } else {
            icon.classList.remove("far");
            icon.classList.add("fas");
            favBtn.classList.add("favorited");
            if (id) {
                if (!favs.includes(id)) {
                    favs.push(id);
                    saveFavorites(favs);
                }
            }
        }
    });

    updateFavoriteButtons();
    document.addEventListener("componentsLoaded", updateFavoriteButtons);
    const favObserver = new MutationObserver(updateFavoriteButtons);
    favObserver.observe(document.body, { childList: true, subtree: true });

    // ─── DARK MODE / LIGHT MODE THEME INITIALIZER ────────────────────────────
    function updateThemeIcon(isDark) {
        const themeToggleBtn = document.getElementById("themeToggle");
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector("i");
        if (icon) {
            icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
        }
    }

    function initTheme() {
        const savedTheme = localStorage.getItem("mobilaz_theme");
        const isDark = savedTheme === "dark";
        if (isDark) {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
        updateThemeIcon(isDark);

        // Theme toggle button logic
        const themeToggleBtn = document.getElementById("themeToggle");
        if (themeToggleBtn && !themeToggleBtn.dataset.themeListenerAttached) {
            themeToggleBtn.dataset.themeListenerAttached = "true";
            themeToggleBtn.addEventListener("click", function () {
                const currentTheme = document.documentElement.getAttribute("data-theme");
                let newTheme = "light";
                if (currentTheme !== "dark") {
                    newTheme = "dark";
                    document.documentElement.setAttribute("data-theme", "dark");
                    updateThemeIcon(true);
                }
                else {
                    document.documentElement.removeAttribute("data-theme");
                    updateThemeIcon(false);
                }
                localStorage.setItem("mobilaz_theme", newTheme);
            });
        }
    }

    initTheme();
    document.addEventListener('componentsLoaded', function () {
        initTheme();
    });

    // ─── CATALOG & ADS FILTER LOGIC ──────────────────────────────────────────
    function filterAds(category, brand, query) {
        const catalog = document.getElementById('catalog') || 
                        document.querySelector('.phone-grid') || 
                        document.getElementById('phone-ads-container') || 
                        document.querySelector('.all-ads-container');
        
        // Safety check: ensure container exists before operating
        if (!catalog) return 0;

        // Ensure catalog container display is always visible as grid
        catalog.style.display = 'grid';

        // Ensure Kataloq button and wrapper NEVER hide
        const catalogBtns = document.querySelectorAll('#catalogBtn, .catalog-btn, .catalog-button, .btn-katalog');
        catalogBtns.forEach(b => {
            b.style.display = 'inline-flex';
            b.style.visibility = 'visible';
            b.style.opacity = '1';
            const wrapper = b.closest('.catalog-wrapper, .catalog-dropdown');
            if (wrapper) {
                wrapper.style.display = 'inline-block';
                wrapper.style.visibility = 'visible';
                wrapper.style.opacity = '1';
            }
        });

        const rawCat = (category || '').toString().trim().toLowerCase();
        const catAliases = {
            all: ['all', '', 'hamısı', 'hamisi'],
            '': ['all', '', 'hamısı', 'hamisi'],
            hamısı: ['all', '', 'hamısı', 'hamisi'],
            hamisi: ['all', '', 'hamısı', 'hamisi'],
            telefon: ['telefon', 'phone', 'telefonlar'],
            phone: ['telefon', 'phone', 'telefonlar'],
            tablet: ['planset', 'planşet', 'tablet', 'planşetlər'],
            'planşet': ['planset', 'planşet', 'tablet', 'planşetlər'],
            planset: ['planset', 'planşet', 'tablet', 'planşetlər'],
            headphone: ['qulaqliq', 'qulaqlıq', 'headphone', 'qulaqcıqlar'],
            'qulaqlıq': ['qulaqliq', 'qulaqlıq', 'headphone', 'qulaqcıqlar'],
            qulaqliq: ['qulaqliq', 'qulaqlıq', 'headphone', 'qulaqcıqlar'],
            accessory: ['aksesuar', 'aksessuar', 'accessory', 'telefon aksessuarları', 'saat', 'watch', 'aksesuarlar'],
            'aksesuar': ['aksesuar', 'aksessuar', 'accessory', 'telefon aksessuarları', 'saat', 'watch', 'aksesuarlar'],
            aksessuar: ['aksesuar', 'aksessuar', 'accessory', 'telefon aksessuarları', 'saat', 'watch', 'aksesuarlar']
        };

        const isAll = !rawCat || rawCat === 'all' || rawCat === 'hamısı' || rawCat === 'hamisi';
        const targetCategories = isAll ? null : (catAliases[rawCat] || [rawCat]);

        const adCards = catalog.querySelectorAll('.elan-card, .ad-card');
        let visibleCount = 0;

        adCards.forEach(card => {
            let matches = true;
            const cardCat = (card.getAttribute('data-category') || '').trim().toLowerCase();
            const cardBrand = (card.getAttribute('data-brand') || '').trim().toLowerCase();
            const cardTitle = (card.querySelector('.ad-title')?.textContent || '').toLowerCase();
            const cardText = (card.textContent || '').toLowerCase();

            // 1. Category check
            if (targetCategories) {
                if (!targetCategories.includes(cardCat)) {
                    matches = false;
                }
            }

            // 2. Brand check (e.g. Samsung, Apple, Xiaomi)
            if (matches && brand && brand.toLowerCase() !== 'all' && brand !== '') {
                const b = brand.toLowerCase().trim();
                if (!cardBrand.includes(b) && !cardTitle.includes(b)) {
                    matches = false;
                }
            }

            // 3. Search query check
            if (matches && query) {
                const q = query.toLowerCase().trim();
                if (!cardText.includes(q)) {
                    matches = false;
                }
            }

            const targetEl = card.closest('a') || card;
            if (matches) {
                targetEl.style.display = '';
                card.style.display = '';
                visibleCount++;
            } else {
                targetEl.style.display = 'none';
            }
        });

        console.log("Filtered ads count: " + visibleCount);

        // Keep category buttons active state synchronized
        if (category !== undefined) {
            document.querySelectorAll('.filter-pill.category-button, .category-buttons button').forEach(btn => {
                const val = (btn.getAttribute('data-value') || '').toLowerCase().trim();
                if (isAll) {
                    if (!val || val === 'all' || val === 'hamısı') btn.classList.add('active');
                    else btn.classList.remove('active');
                } else if (val === rawCat || (catAliases[rawCat] && catAliases[rawCat].includes(val))) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        if (query !== undefined && typeof window.showSearchFeedback === 'function') {
            window.showSearchFeedback(query, visibleCount);
        }

        return visibleCount;
    }

    window.filterAds = filterAds;
    window.filterCatalogAds = filterAds;


});


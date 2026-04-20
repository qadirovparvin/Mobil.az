"use strict";
document.addEventListener("DOMContentLoaded", function () {
    const translations = {
        AZ: {
            Contact: "Əlaqə",
            About: "Haqqımızda",
            Stores: "Mağazalar",
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
            "all-models": "Bütün modellər",
            "other-model": "Digər model",
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
            "faq-q1": "Mobil.az-da elan yerləşdirmək ödənişlidir?",
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
            "about-h1": "Mobil.az — Azərbaycanda Telefon Elanlarının Yeni Ünvanı!",
            "about-sub": "Yalnız telefonlar üçün ixtisaslaşmış bazar yeri!",
            "about-p1": "Azərbaycan Respublikasının elektron ticarət sektorunda <b style=\"color: blueviolet;\">Mobil.az</b> adlı innovativ platforma yeni bir inkişaf mərhələsinin başlanğıcını təşkil edir. Bu müasir elektron ticarət həlli, ənənəvi elan saytlarından fərqli olaraq, özünün ixtisaslaşdırılmış yanaşması ilə diqqəti cəlb edir. Mobil.az platforması spesifik olaraq mobil telefon və onların aksesuarlarının alqı-satqısı üzərində fokuslanır.",
            "about-p2": "İstifadəçilər həm yeni, həm də işlənmiş cihazlar üçün elanlar yerləşdirə bilərlər.",
            "about-p3": "Platformamız müxtəlif qiymət aralığında olan məhsulları əhatə edir və hər büdcəyə uyğun seçimlər təqdim edir. Mobil.az-da siz həmçinin telefonların texniki xüsusiyyətlərini, qiymətini, vəziyyətini (yeni/işlənmiş) və digər ətraflı məlumatları görə bilərsiniz.",
            "about-h2-1": "Mobil.az-da Nə Satıla Bilər?",
            "about-ul1-1": "Yeni və işlənmiş smartfonlar, bütün marka və qiymət aralıqları",
            "about-ul1-2": "Apple, Samsung, Xiaomi və digər istehsalçılardan planşet modelləri",
            "about-ul1-3": "Simli və simsiz qulaqlıqlar, audio aksesuarlar",
            "about-ul1-4": "Adapterlər, qoruyucu örtüklər, ekran qoruyucuları və daha çoxu",
            "about-category-summary": "Həm alıcılar, həm də satıcılar Mobil.az-da işlərini asanlıqla həll edirlər. Elanınızı pulsuz yerləşdirin, alıcı tapın.",
            "about-h2-2": "Niyə məhz Mobil.az?",
            "about-ul2-1": "Ixtisaslaşmış bazar – Platforma yalnız mobil telefon və telefon aksesuarlarının alqı-satqısına həsr olunmuşdur.",
            "about-ul2-2": "İstifadəçilər üçün rahatlıq – Axtarış və filtr sistemləri sayəsində istənilən modeli tapmaq mümkündür.",
            "about-ul2-3": "Ən müasir və təhlükəsiz alqı-satqı – Satıcılar üçün reytinq və şərh sistemi mövcuddur.",
            "about-ul2-4": "Müxtəlif elan paketləri – İstifadəçilər tələbatlarına uyğun olaraq standart, PRO və VIP elan paketlərindən istifadə edə bilərlər",
            "about-h2-3": "Mobil.az Necə İşləyir?",
            "about-p4": "Platformamız həm fərdi satıcılar, həm də mağazalar üçün əlverişli satış mühiti yaradır.",
            "about-h3-1": "1. Fərdi Satıcılar Üçün",
            "about-ul3-1": "İstənilən şəxs – öz telefonunu satmaq istəyən hər kəs pulsuz və ya PRO elan yerləşdirə bilər.",
            "about-ul3-2": "Birbaşa alıcı ilə əlaqə – Satıcılar telefon nömrəsi və ya platforma içi mesajlaşma ilə alıcılarla danışa bilərlər.",
            "about-ul3-3": "Geniş axtarış imkanları – Alıcılar telefon modellərinə, qiymət aralığına və vəziyyətinə görə filtr edə bilərlər.",
            "about-h3-2": "2. Mağazalar Üçün",
            "about-ul4-1": "Telefon mağazaları – Mobil.az-da qeydiyyatdan keçərək öz brend mağazalarını aça bilərlər.",
            "about-ul4-2": "Şirkətlər üçün premium funksiyalar – Mağazalar üçün xüsusi reklam və VIP elan imkanları mövcuddur.",
            "about-ul4-3": "Brend vitrini – Şirkətlər məhsullarını daha geniş auditoriyaya təqdim edə bilərlər.",
            "about-h2-4": "Gələcək Planlar və İnkişaf",
            "about-ul5-1": "Mobil.az mobil tətbiqi istifadəyə veriləcək ki, istifadəçilər mobil cihazlarından daha rahat elan yerləşdirə və axtarış edə bilsinlər.",
            "about-ul5-2": "Süni intellekt (AI) inteqrasiyası ilə ağıllı elan yerləşdirmə və təkmilləşdirilmiş axtarış sistemi yaradılacaq.",
            "about-ul5-3": "Avtomatik elan yoxlama sistemi – Süni intellekt vasitəsilə yalnız real elanların dərc olunması təmin ediləcək.",
            "about-p5": "Mobil.az, Azərbaycanda yalnız telefon və aksesuar satışına yönəlmiş yeni elan platformasıdır.",
            "about-tagline": "Mobil.az – Telefon alqı-satqısının yeni ünvanı!",
            "stores-h1": "Sevdiyiniz mağazaları kəşf edin",
            "stores-p": "Sizin üçün ən yaxşı mağazaları bir araya gətirdik",
            "stores-search-placeholder": "Mağaza axtar...",
            "stores-search-btn": "Axtar",
            "stores-add-btn": "Mağaza aç",
            "stores-view-btn": "Mağazaya bax",
            "stores-contact-btn": "Əlaqə",
            "stores-active-ads": "Aktiv Elan",
            "stores-review": "rəy",
            "stores-nationwide-delivery": "Ölkədaxili Çatdırılma",
            "stores-barter": "Barter mümkündür",
            "stores-warranty": "İl Rəsmi Zəmanət",
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
            "elan-ram": "RAM (GB)",
            "elan-screen": "Ekran ölçüsü",
            "elan-battery": "Batareya (mAh)",
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
            "opt-telefon": "Telefon",
            "opt-planshet": "Planşet",
            "opt-aksesuar": "Aksesuar",
            "opt-headphone": "Qulaqlıq",
            "opt-yeni": "Yeni",
            "opt-islenmiş": "İşlənmiş",
            "opt-64-az": "64 GB-dən az",
            "opt-64": "64 GB",
            "opt-128": "128 GB",
            "opt-256": "256 GB",
            "opt-512": "512 GB",
            "opt-512-cox": "512 GB-dən daha çox",
            "opt-qara": "Qara",
            "opt-ag": "Ağ",
            "opt-qizili": "Qızılı",
            "opt-gumushu": "Gümüşü",
            "opt-boz": "Boz",
            "opt-mavi": "Mavi",
            "opt-diger": "Digər",
            "opt-brand-placeholder": "Əvvəlcə kateqoriya seçin",
            "opt-model-placeholder-cat": "Əvvəlcə kateqoriya seçin",
            "opt-model-placeholder-brand": "Model seçin",
            "opt-diger-brand": "Digər",
            "opt-diger-model": "Digər model",
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
            // Rules page
            "rules-page-h1": "Qaydalar və Təhlükəsizlik",
            "rules-page-sub": "Platformamızdan təhlükəsiz və rahat istifadə etmək üçün bu qaydaları oxuyun.",
            "rules-tab-general": "Ümumi Qaydalar",
            "rules-tab-posting": "Elan Yerləşdirmə",
            "rules-tab-safety": "Təhlükəsizlik",
            "rules-tab-prohibited": "Qadağalar",
            "rules-h2-general": "Ümumi İstifadə Qaydaları",
            "rules-g1": "Platforma yalnız mobil telefon, planşet, qulaqlıq və telefon aksesuarlarının alqı-satqısı üçün nəzərdə tutulmuşdur.",
            "rules-g2": "Qeydiyyatdan keçmək üçün real şəxsi məlumatlarınızı (ad, soyad, telefon nömrəsi) daxil etməlisiniz.",
            "rules-g3": "Hər istifadəçinin yalnız bir hesabı ola bilər. Çoxsaylı hesablar bloklanacaq.",
            "rules-g4": "Platformada yerləşdirilən bütün elanlar moderasiyadan keçir. Müvafiq olmayan elanlar silinir.",
            "rules-g5": "Elanın müddəti 30 gündür. Müddəti bitmiş elanlar avtomatik arxivlənir.",
            "rules-g6": "Eyni elanı bir neçə dəfə yerləşdirmək qadağandır. Belə elanlar sistematik olaraq silinəcəkdir.",
            "rules-h2-posting": "Elan Yerləşdirmə Qaydaları",
            "rules-p1": "Elanı düzgün kateqoriyada yerləşdirin: Telefonlar, Planşetlər, Qulaqlıqlar və ya Aksesuarlar.",
            "rules-p2": "Başlıqda qiymət yazmayın — bunun üçün qiymət sahəsi ayrılmışdır. Bu tip elanlara düzəliş edilməlidir.",
            "rules-p3": "Məhsulun real vəziyyətini qeyd edin: Yeni, İşlənmiş və s. Yanıltıcı məlumat vermək qadağandır.",
            "rules-p4": "Ən az 1, maksimum 10 keyfiyyətli şəkil əlavə edin. Hər şəklin ölçüsü 5MB-dan artıq olmamalıdır.",
            "rules-p5": "Şəkillərdə, başlıqda və ya təsvirdə telefon nömrəsi, e-mail ünvanı və ya sayt adresi göstərməyin.",
            "rules-p6": "Məhsulun texniki xüsusiyyətlərini (yaddaş, rəng, NFC, suya davamlılıq və s.) dürüst qeyd edin.",
            "rules-p7": "Zəmanəti olan məhsullar üçün zəmanət müddəti mütləq qeyd edilməlidir.",
            "rules-p8": "Qiymət AZN (Azərbaycan Manatı) ilə göstərilməlidir. Başqa valyutada göstərmək qadağandır.",
            "rules-p9": "Hər kateqoriya üçün müəyyən sayda aktiv elan limiti mövcuddur. Premium paketlər bu limiti artırır.",
            "rules-p10": "Elanınızla əlaqədar bütün bildirişlər qeydiyyatda istifadə etdiyiniz e-mail ünvanına göndəriləcəkdir.",
            "rules-h2-safety": "Təhlükəsizlik Tövsiyələri",
            "safety-c1-h": "Şəxsən görüşün",
            "safety-c1-p": "Mümkün qədər alıcı və ya satıcı ilə ictimai yerdə, gündüz vaxtı görüşün. Tənha və ya qaranlıq yerlərdə görüşməkdən çəkinin.",
            "safety-c2-h": "Məhsulu yoxlayın",
            "safety-c2-p": "Məhsulu almazdan əvvəl onun IMEI kodunu, batareya sağlamlığını, ekranını və bütün mövcud funksiyalarını yoxlayın.",
            "safety-c3-h": "Ödəniş",
            "safety-c3-p": "Ödənişi yalnız məhsulu təhvil aldıqdan sonra və şəxsən həyata keçirin. Avans ödənişi etməkdən çəkinin.",
            "safety-c4-h": "Şübhəli elanları bildirin",
            "safety-c4-p": "Hər hansı şübhəli və ya yanıltıcı elanı \"Şikayət et\" düyməsi vasitəsilə dərhal moderatorlara bildirin.",
            "safety-warning": "Diqqət: Mobil.az heç vaxt SMS, e-mail və ya zənglə sizin şifrənizi, bank kartı məlumatlarınızı tələb etmir. Belə sorğuları dərhal rədd edin.",
            "rules-h2-prohibited": "Qadağan Edilən Fəaliyyətlər",
            "rules-pr1": "Oğurlanmış, saxta və ya müvafiq sənədi olmayan məhsulları satmaq qadağandır. Bu cür elanlar silinir, hesab bloklanır və hüquq orqanlarına xəbər verilir.",
            "rules-pr2": "Başqasına məxsus şəkillərdən, adlardan və ya marka loqotiplərindən icazəsiz istifadə edərək elan yerləşdirmək qadağandır.",
            "rules-pr3": "Aldadıcı qiymətlər, yalançı texniki xüsusiyyətlər və yanıltıcı fotoşəkillərdən istifadə etmək qadağandır.",
            "rules-pr4": "Digər istifadəçilərə qarşı təhqiredici, ayrı-seçkilik xarakterli və ya aqressiv ünsiyyət formaları qadağandır.",
            "rules-pr5": "Spam təbiətli elanlar və eyni elanın sistematik olaraq yenidən yerləşdirilməsi qadağandır.",
            // Privacy page
            "privacy-page-h1": "Məxfilik Siyasəti",
            "privacy-page-sub": "Mobil.az istifadəçilərimizin məxfiliyini qorumağı prinsip kimi qəbul edir.",
            "privacy-updated": "Son yenilənmə: Mart 2025",
            "privacy-h2-collect": "Hansı Məlumatları Toplayırıq?",
            "privacy-h2-use": "Məlumatları Necə İstifadə Edirik?",
            "privacy-h2-share": "Məlumatları Paylaşırıqmı?",
            "privacy-h2-cookies": "Çərəzlər (Cookies)",
            "privacy-h2-rights": "İstifadəçi Hüquqları",
            "privacy-h2-security": "Məlumat Təhlükəsizliyi",
            "privacy-h2-changes": "Siyasətdə Dəyişikliklər",
            "privacy-h2-contact": "Bizimlə Əlaqə",
            "privacy-p-collect": "Mobil.az-da qeydiyyatdan keçdiyiniz zaman aşağıdakı məlumatları toplamaq lazım gəlir:",
            "privacy-collect-1": "Ad, soyad — hesabınızı fərdiləşdirmək və identifikasiya etmək üçün.",
            "privacy-collect-2": "Telefon nömrəsi — elanla bağlı əlaqə üçün və hesab doğrulaması üçün.",
            "privacy-collect-3": "E-mail ünvanı — bildirişlər, şifrə sıfırlanması və sistemdən məlumatlar göndərmək üçün.",
            "privacy-collect-4": "Yerləşdirdiyiniz elan məlumatları (şəkillər, təsvir, qiymət, məhsul xüsusiyyətləri).",
            "privacy-collect-5": "Texniki məlumatlar: IP ünvanı, brauzer növü, platforma fəaliyyət jurnalları (log).",
            "privacy-p-use": "Topladığımız məlumatlar aşağıdakı məqsədlər üçün istifadə olunur:",
            "privacy-use-1": "Hesabınızı yaratmaq, idarə etmək və qorumaq.",
            "privacy-use-2": "Elanlarınızı platformada yerləşdirmək və göstərmək.",
            "privacy-use-3": "Alıcı ilə satıcı arasında ünsiyyəti asanlaşdırmaq.",
            "privacy-use-4": "Şübhəli fəaliyyətləri aşkar etmək və platformanın təhlükəsizliyini təmin etmək.",
            "privacy-use-5": "Elan, hesab vəziyyəti haqqında bildirişlər göndərmək.",
            "privacy-use-6": "Xidmətimizi inkişaf etdirmək üçün statistik təhlil aparmaq (şəxsi məlumatlar anonim şəkildə).",
            "privacy-p-share1": "Mobil.az şəxsi məlumatlarınızı üçüncü şəxslərə satmır. Məlumatlar yalnız aşağıdakı hallardan birinin yarandığı zaman paylaşıla bilər:",
            "privacy-share-1": "Qanunvericiliyin tələb etdiyi hallarda (məhkəmə qərarı, hüquq mühafizə orqanlarının sorğusu).",
            "privacy-share-2": "Xidmət təminatçıları ilə (hosting, e-mail göndərmə) — yalnız xidmət çərçivəsində.",
            "privacy-share-3": "Fırıldaqçılıq hallarında platformanı qorumaq məqsədilə iş ortaqlarımızla.",
            "privacy-note-share": "Elanınızda göstərdiyiniz telefon nömrəsi elanı görən bütün istifadəçilər tərəfindən görülə bilər. Telefon nömrənizi elanda göstərmək istəyib-istəmədiyinizi siz seçirsiniz.",
            "privacy-p-cookies1": "Mobil.az veb saytımızın düzgün işləməsi üçün çərəzlərdən istifadə edir. Çərəzlər sizin brauzerinizdə saxlanan kiçik məlumat fayllarıdır.",
            "privacy-p-cookies2": "İstifadə etdiyimiz çərəzlər:",
            "privacy-cookie-1": "<strong>Sessiya çərəzləri:</strong> Siz saytı bağladıqdan sonra silinir. Giriş statusunu saxlamaq üçün istifadə olunur.",
            "privacy-cookie-2": "<strong>Daimi çərəzlər:</strong> Dil seçimi, qaranlıq rejim kimi tercihləriniizi yadda saxlamaq üçün istifadə olunur.",
            "privacy-p-cookies3": "Brauzerin parametrlərini dəyişdirərək çərəzləri qəbul etməkdən imtina edə bilərsiniz, amma bu halda bəzi funksiyalar düzgün işləməyə bilər.",
            "privacy-p-rights": "Siz öz məlumatlarınıza dair aşağıdakı hüquqlara maliksiniz:",
            "privacy-right-1": "Hesabınızdakı şəxsi məlumatlarınıza baxmaq və onları yeniləmək hüququ.",
            "privacy-right-2": "Hesabınızı tamamilə silmək hüququ — bu halda bütün məlumatlarınız sistemdən silinir.",
            "privacy-right-3": "Marketinq bildirişlərindən imtina etmək hüququ.",
            "privacy-right-4": "Məlumatlarınızın işlənməsinə itiraz etmək hüququ (qanuni əsaslar daxilində).",
            "privacy-rights-note": "Bu hüquqlarınızı həyata keçirmək üçün aşağıdakı e-mail ünvanı vasitəsilə bizimlə əlaqə saxlaya bilərsiniz.",
            "privacy-p-security1": "Məlumatlarınızın təhlükəsizliyi bizim əsas prioritetimizdir. Mobil.az istifadəçilərin məlumatlarını qorumaq üçün lazımi təhlükəsizlik tədbirləri görür. Şifrələr təhlükəsiz kriptoqrafik üsullarla saxlanılır.",
            "privacy-p-security2": "Bununla belə, heç bir internet platforması tam 100% təhlükəsizlik zəmanəti verə bilməz. Şifrənizi heç kimlə paylaşmayın və güclü, unikal şifrə istifadə edin.",
            "privacy-p-changes": "Bu məxfilik siyasəti zaman-zaman yenilənə bilər. Əhəmiyyətli dəyişikliklər olduqda e-mail vasitəsilə məlumatlandırılacaqsınız. Maksimum şəffaflıq üçün bu səhifəni müntəzəm yoxlamağınızı tövsiyə edirik.",
            "privacy-p-contact": "Məxfilik siyastimizlə bağlı hər hansı sualınız varsa, bizimlə əlaqə saxlayın:",
            "privacy-contact-email-h": "E-mail",
            "privacy-contact-phone-h": "Telefon",
            "stores-h1": "Sevdiyiniz mağazaları kəşf edin",
            "stores-p": "Sizin üçün ən yaxşı mağazaları bir araya gətirdik",
            "stores-search-placeholder": "Mağaza axtar...",
            "stores-search-btn": "Axtar",
            "stores-add-btn": "Mağaza aç",
            "stores-view-btn": "Mağazaya bax",
            "stores-contact-btn": "Əlaqə",
            // Create Shop page
            "cs-hero-h1": "Öz Mağazanızı Açın",
            "cs-hero-p": "Mobil.az-ın gücündən yararlanın — minlərlə alıcıya çatın, elanlarınızı idarə edin və biznesinizi böyüdün.",
            "cs-badge-fast": "Sürətli Qeydiyyat",
            "cs-badge-users": "Günlük Artan İstifadəçi Bazası",
            "cs-badge-safe": "Təhlükəsiz & Rəsmi",
            "cs-pkg-chip": "Paketlər",
            "cs-pkg-h2": "Biznesinizə Uyğun Paketi Seçin",
            "cs-pkg-sub": "Hamısı 30 günlük pulsuz sınaq dövrü ilə başlayır. İstədiyiniz vaxt dəyişdirin.",
            "cs-pkg-select": "Paketi Seç",
            "cs-popular-badge": "Ən Populyar",
            "cs-starter-name": "Başlanğıc",
            "cs-starter-tag": "Kiçik satıcılar üçün ideal",
            "cs-starter-price": "Pulsuz",
            "cs-starter-period": "Başlanğıc üçün · Ödənişsiz",
            "cs-starter-f1": "5 aktiv elan",
            "cs-starter-f2": "Əsas mağaza profili",
            "cs-starter-f3": "Mobil.az siyahısında görünmə",
            "cs-starter-f4": "Rəsmi mağaza nişanı yoxdur",
            "cs-starter-f5": "Seçilmiş elan dəstəyi yoxdur",
            "cs-starter-f6": "Analitika paneli yoxdur",
            "cs-pro-name": "Pro Mağaza",
            "cs-pro-tag": "Aktiv satış edən və müştəri etibarı qazanmaq istəyən mağazalar üçün.",
            "cs-monthly": "/ ay · aylıq ödəniş",
            "cs-pro-f1": "50 aktiv elan",
            "cs-pro-f2": "Mavi Doğrulama Nişanı ✓",
            "cs-pro-f3": "Şəxsi mağaza linki (Instagram profilinə qoymaq üçün)",
            "cs-pro-f4": "Əsas Analitika: yalnız baxış sayı",
            "cs-pro-f5": "Hər ay 3 elan üçün avtomatik «Irəli çək» hədiyyəsi",
            "cs-elite-tag": "Böyük mağazalar & distribüterlar",
            "cs-elite-f1": "Limitsiz elan",
            "cs-elite-f2": "Premium qızıl nişan 👑",
            "cs-elite-f3": "Limitsiz seçilmiş elan",
            "cs-elite-f4": "Ana səhifə banner reklamı",
            "cs-elite-f5": "Ətraflı analitika və hesabatlar",
            "cs-elite-f6": "Xüsusi dəstək (7/24)",
            "cs-form-chip": "Qeydiyyat",
            "cs-form-h2": "Mağaza Məlumatlarını Daxil Edin",
            "cs-form-sub": "Aşağıdakı formu doldurun, komandamız sizinlə əlaqə saxlayacaq.",
            "cs-form-pkg-default": "Pro Mağaza paketi seçildi",
            "cs-form-pkg-hint": "Paketi dəyişmək üçün yuxarıdan seçin",
            "cs-lbl-store-name": "Mağaza Adı *",
            "cs-ph-store-name": "Məs: LeadTech Mobile",
            "cs-lbl-owner": "Sahibin Adı Soyadı *",
            "cs-ph-owner": "Məs: Əli Məmmədov",
            "cs-lbl-phone": "Əlaqə Nömrəsi *",
            "cs-lbl-email": "E-poçt *",
            "cs-ph-email": "magaza@example.com",
            "cs-lbl-category": "Mağaza Kateqoriyası *",
            "cs-ph-category": "Kateqoriya seçin",
            "cs-cat-phones": "Smartfonlar",
            "cs-cat-accessories": "Aksesuarlar",
            "cs-cat-tablets": "Planşetlər",
            "cs-cat-repair": "Təmir & Servis",
            "cs-lbl-address": "Ünvan *",
            "cs-ph-address": "Küçə, bina, mağaza nömrəsi...",
            "cs-lbl-desc": "Mağaza Haqqında *",
            "cs-ph-desc": "Mağazanız, satdığınız məhsullar, zəmanət şərtləri haqqında qısa məlumat...",
            "cs-lbl-logo": "Mağaza Logosu",
            "cs-logo-click": "Şəkil yükləmək üçün klikləyin",
            "cs-logo-drag": "və ya sürükleyin",
            "cs-logo-max": "Maks. 5 MB",
            "cs-lbl-whatsapp": "WhatsApp Nömrəsi",
            "cs-lbl-instagram": "Instagram Linki",
            "cs-ph-instagram": "https://instagram.com/magaza",
            "cs-optional": "(İstəyə bağlı)",
            "cs-submit": "Mağazamı Aç",
            "cs-form-note": "Formu göndərməklə <a href='rules.html'>Qaydalar</a> və <a href='privacy.html'>Məxfilik Siyasəti</a> ilə razılaşırsınız.",
            "cs-lbl-city": "Şəhər *",
            "cs-ph-city": "Şəhər seçin",
            "cs-ben-chip": "Üstünlüklər",
            "cs-ben-h2": "Niyə Mobil.az?",
            "cs-ben1-h": "Artan Alıcı Bazası",
            "cs-ben1-p": "Hər gün platformamızı ziyarət edən aktiv alıcılara mağazanızı tanıdın.",
            "cs-ben2-h": "Satışlarınızı İzləyin",
            "cs-ben2-p": "Analitika paneliylə baxışları, klikləri və müştəri davranışını izləyin.",
            "cs-ben3-h": "Tam Mobil Uyğun",
            "cs-ben3-p": "Müştəriləriniz istənilən cihazdan mağazanıza rahat daxil ola bilər.",
            "cs-ben4-h": "Dəstək Komandası",
            "cs-ben4-p": "Hər sualınız üçün peşəkar dəstək komandamız həmişə sizin yanınızdadır.",
            "cs-pro-f6": "WhatsApp inteqrasiyası",
            "cs-elite-name": "Premium",
            "elan-badge": "Aktiv",
            "elan-subtitle": "Telefon, planşet, qulaqlıq və aksesuarlarınızı sürətlə doğru alıcıya çatdırın",
            "elan-stat-safe": "Güvənli platforma",
            "elan-stat-free": "Pulsuz elan",
            "elan-stat-days": "30 gün aktiv",
            "elan-step1": "Məlumatlar",
            "elan-step2": "Şəkillər",
            "elan-step3": "Yayımla",
            "elan-section1": "Əsas Məlumat",
            "elan-region": "Region *",
            "elan-section2": "Texniki Xüsusiyyətlər",
            "elan-features-label": "Xüsusiyyətlər",
            "elan-chip-nfc": "NFC",
            "elan-chip-fingerprint": "Barmaq izi",
            "elan-chip-waterproof": "Suya davamlı",
            "elan-chip-expandable": "Əlavə yaddaş",
            "elan-chip-delivery": "Çatdırılma",
            "elan-section3": "Təsvir və Şəkillər",
            "elan-upload-text": "Şəkilləri buraya sürükleyin və ya",
            "elan-upload-span": "seçin",
            "elan-section4": "Əlaqə Məlumatları",
            "elan-submit-note": "Elanınız dərc edilməzdən əvvəl moderasiyadan keçəcək.",
            "elan-tip-title": "Məsləhət",
            "elan-tip-text": "Yüksək keyfiyyətli şəkillər elanınızın 3x daha tez satışına kömək edir. Ən azı 4–6 fotoşəkil əlavə edin.",
            "filter-memory-label": "Yaddaş (ROM)",
            "filter-ram-label": "RAM",
            "ram-2gb": "2 GB",
            "ram-4gb": "4 GB",
            "ram-6gb": "6 GB",
            "ram-8gb": "8 GB",
            "ram-12gb": "12 GB",
            "ram-16gb": "16 GB+",
            "filter-screen-label": "Ekran ölçüsü",
            "screen-small": "<5.5\"",
            "screen-medium": "5.5–6.1\"",
            "screen-large": "6.1–6.7\"",
            "screen-xlarge": ">6.7\"",
            "filter-battery-label": "Batareya",
            "battery-low": "<3000 mAh",
            "battery-mid": "3000–4500 mAh",
            "battery-high": ">4500 mAh",
            "filter-seller-label": "Satıcı növü",
            "seller-private": "Şəxsi",
            "seller-store": "Mağaza",
            "filter-category-label": "Kateqoriya",
            "filter-cat-all": "Hamısı",
            "filter-cat-phone": "Telefonlar",
            "filter-cat-tablet": "Planşetlər",
            "filter-cat-headphone": "Qulaqcıqlar",
            "filter-cat-accessory": "Aksesuarlar",
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
            "cab-edit-btn": "Redaktə et",
            "cab-name-lbl": "Ad:",
            "cab-surname-lbl": "Soyad:",
            "cab-phone-lbl": "Telefon:",
            "cab-email-lbl": "E-poçt:",
            "fav-empty-desc": "Hələ heç bir elan seçilmişlərə əlavə edilməyib.",
            "fav-empty-link": "Elanlara baxın",
            "fav-count-text": "elan seçilmişlərə əlavə edilib",
            "fav-select-all": "Hamısını seç",
            "fav-delete-selected": "Seçilənləri sil",
            "fav-delete-all": "Hamısını sil",
            "fav-delete-confirm": "Bütün seçilmiş elanları silmək istədiyinizə əminsiniz?",
            "cs-lbl-payment": "Ödəniş Üsulu *",
            "cs-pay-card": "Bank Kartı",
            "cs-pay-card-sub": "Onlayn ödəniş (Visa/MasterCard)",
            "cs-pay-transfer": "Bank Köçürməsi",
            "cs-pay-transfer-sub": "Şirkət hesabına ödəniş",
            "cs-pay-terminal": "Terminal",
            "cs-pay-terminal-sub": "eManat / MilliÖn",
            "cs-pay-card-details": "Kart Məlumatları",
            "cs-lbl-card-num": "Kartın Nömrəsi",
            "cs-lbl-card-exp": "Bitmə Tarixi",
            "cs-lbl-card-cvv": "CVV",
            "cs-pay-transfer-details": "Köçürmə Məlumatları",
            "cs-pay-transfer-info": "Zəhmət olmasa, ödənişi aşağıdakı hesaba edin və VÖEN-inizi daxil edin:",
            "cs-lbl-voen": "Sizin VÖEN / İNV",
            "cs-pay-terminal-details": "Terminal (MilliÖn / eManat)",
            "cs-pay-terminal-info": "Ödənişi terminal vasitəsilə etdikdən sonra qəbz nömrəsini daxil edin.",
            "cs-lbl-receipt": "Qəbz Nömrəsi",
            // Ad Detail page
            "det-badge-new": "Yeni",
            "det-condition-label": "Vəziyyəti:",
            "det-city-label": "Şəhər:",
            "det-delivery-label": "Çatdırılma:",
            "det-delivery-yes": "Var",
            "det-delivery-no": "Yoxdur",
            "det-price-note": "Qiymət sabitdir · Barter mümkündür",
            "det-spec-storage": "Yaddaş",
            "det-spec-screen": "Ekran ölçüsü",
            "det-spec-refresh": "Ekran yenilənmə",
            "det-spec-battery": "Batareya",
            "det-spec-processor": "Prosessor",
            "det-spec-cam-rear": "Kamera (arxa)",
            "det-spec-cam-front": "Kamera (ön)",
            "det-spec-color": "Rəng",
            "det-spec-condition": "Vəziyyəti",
            "det-spec-waterproof": "Suya davamlılıq",
            "det-feat-fingerprint": "Barmaq izi",
            "det-feat-waterproof-chip": "IP68 Suya davamlı",
            "det-feat-no-expandable": "Əlavə yaddaş yox",
            "det-spec-included": "✓ Daxildir",
            "det-spec-available": "✓ Var",
            "det-specs-title": "Texniki Xüsusiyyətlər",
            "det-desc-title": "Şəxsi açıqlama",
            "det-reviews-title": "Satıcı haqqında rəylər",
            "det-reviews-based": "rəy əsasında",
            "det-write-review-title": "Öz rəyinizi yazın",
            "det-review-name-ph": "Adınız (məs. Əli M.)",
            "det-review-text-ph": "Satıcı ilə təcrübənizi paylaşın...",
            "det-review-submit": "Rəy Göndər",
            "det-ad-no": "Elan №:",
            "det-posted": "Yərləşdirildi:",
            "det-updated": "Yeniləndi:",
            "det-seller-personal": "Şəxsi hesab",
            "det-seller-since": "Üzv olub:",
            "det-ads-shared": "Paylaşılan elan",
            "det-rating": "★ Reytinq",
            "det-positive": "Müsbət rəy",
            "det-btn-call": "Nömrəni Göstər",
            "det-btn-whatsapp": "WhatsApp ilə Yazın",
            "det-btn-message": "Mesaj Göndər",
            "det-sidebar-review-title": "Müsbət rəy yazın",
            "det-sidebar-review-ph": "Bu satıcı haqqında rəyiniz...",
            "det-safety-title": "Təhlükəsiz Alış",
            "det-safety-1": "Mümkün qədər ictimai yərdə görüşün",
            "det-safety-2": "IMEI kodunu yoxlamadan almayın",
            "det-safety-3": "Avans ödənişindən çəkinin",
            "det-safety-4": "Şüphəli elanı bildirin",
            "det-btn-share": "Paylaş",
            "det-btn-report": "Şikayət et",
            "det-related-title": "Oxşar Elanlar",
            "det-breadcrumb-home": "Ana Səhifə",
            "det-breadcrumb-phones": "Telefonlar",
            // Monetization
            "mon-bump": "İrəli çək",
            "mon-vip": "VİP",
            "mon-pro": "PRO",
            "mon-1day": "1 Gün",
            "mon-3day": "3 Gün",
            "mon-referral-title": "Dostunu gətir, 5 AZN qazan!",
            "mon-referral-desc": "Hər dəvət etdiyiniz dostunuz qeydiyyatdan keçdikdə balansınıza 5 AZN hədiyyə olunacaq.",
            "mon-copy-link": "Linki kopyala",
            "mon-referral-credit": "Referal balansı",
            "mon-promote-ad": "Elanı tanıt",
            "mon-package": "Paket",
            "mon-duration": "Müddət",
            "mon-total": "Cəmi",
            "mon-use-credit": "Referal kreditindən istifadə et (max 50%)",
            "mon-pay-btn": "Ödəniş et"
        },
        ENG: {
            Contact: "Contact",
            About: "About",
            Stores: "Stores",
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
            "all-models": "All models",
            "other-model": "Other model",
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
            "faq-q1": "Is posting an ad on Mobil.az paid?",
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
            "about-h1": "Mobil.az — The New Address for Phone Ads in Azerbaijan!",
            "about-sub": "Specialized marketplace only for phones!",
            "about-p1": "In the e-commerce sector of the Republic of Azerbaijan, an innovative platform named <b style=\"color: blueviolet;\">Mobil.az</b> marks the beginning of a new stage of development. This modern e-commerce solution attracts attention with its specialized approach, unlike traditional ad sites. The Mobil.az platform specifically focuses on the buying and selling of mobile phones and their accessories.",
            "about-p2": "Users can post ads for both new and used devices.",
            "about-p3": "Our platform covers products in various price ranges and offers options for every budget. On Mobil.az, you can also see the technical specifications, price, condition (new/used), and other detailed information of the phones.",
            "about-h2-1": "What can be sold on Mobil.az?",
            "about-ul1-1": "New and used smartphones, all brands and price ranges",
            "about-ul1-2": "Tablet models from Apple, Samsung, Xiaomi and other manufacturers",
            "about-ul1-3": "Wired and wireless headphones, audio accessories",
            "about-ul1-4": "Adapters, protective covers, screen protectors and more",
            "about-category-summary": "Both buyers and sellers do their job easily on Mobil.az. Place your ad for free, find a buyer.",
            "about-h2-2": "Why exactly Mobil.az?",
            "about-ul2-1": "Specialized market - The platform is dedicated only to buying and selling mobile phones and phone accessories.",
            "about-ul2-2": "Convenience for users - Thanks to search and filter systems, you can find any model.",
            "about-ul2-3": "The most modern and safe trade - There is a rating and comment system for sellers.",
            "about-ul2-4": "Various ad packages - Users can use standard, PRO and VIP ad packages according to their needs",
            "about-h2-3": "How does Mobil.az work?",
            "about-p4": "Our platform creates a favorable sales environment for both individual sellers and shops.",
            "about-h3-1": "1. For Individual Sellers",
            "about-ul3-1": "Anyone - anyone who wants to sell their phone can post a free or PRO ad.",
            "about-ul3-2": "Direct contact with buyer - Sellers can talk to buyers via phone number or in-platform messaging.",
            "about-ul3-3": "Extensive search options - Buyers can filter by phone models, price range and condition.",
            "about-h3-2": "2. For Stores",
            "about-ul4-1": "Phone stores - By registering on Mobil.az, they can open their brand stores.",
            "about-ul4-2": "Premium features for companies - Special advertising and VIP advertising opportunities are available for stores.",
            "about-ul4-3": "Brand showcase - Companies can present their products to a wider audience.",
            "about-h2-4": "Future Plans and Development",
            "about-ul5-1": "The Mobil.az mobile application will be put into use so that users can place ads and search more comfortably from their mobile devices.",
            "about-ul5-2": "Smart ad placement and enhanced search system will be created with artificial intelligence (AI) integration.",
            "about-ul5-3": "Automatic ad review system - through artificial intelligence, only real ads will be published.",
            "about-p5": "Mobil.az is a new classified ads platform in Azerbaijan focused only on phone and accessory sales.",
            "about-tagline": "Mobil.az – The new address of phone trading!",
            "stores-h1": "Discover your favorite stores",
            "stores-p": "We have brought together the best stores for you",
            "stores-search-placeholder": "Search store...",
            "stores-search-btn": "Search",
            "stores-add-btn": "Open Store",
            "stores-view-btn": "View store",
            "stores-contact-btn": "Contact",
            "stores-active-ads": "Active Listings",
            "stores-review": "reviews",
            "stores-nationwide-delivery": "Nationwide Delivery",
            "stores-barter": "Barter available",
            "stores-warranty": "Year Official Warranty",
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
            "elan-ram": "RAM (GB)",
            "elan-screen": "Screen Size",
            "elan-battery": "Battery (mAh)",
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
            "opt-telefon": "Phone",
            "opt-planshet": "Tablet",
            "opt-aksesuar": "Accessory",
            "opt-headphone": "Headphones",
            "opt-yeni": "New",
            "opt-islenmiş": "Used",
            "opt-64-az": "Below 64 GB",
            "opt-64": "64 GB",
            "opt-128": "128 GB",
            "opt-256": "256 GB",
            "opt-512": "512 GB",
            "opt-512-cox": "More than 512 GB",
            "opt-qara": "Black",
            "opt-ag": "White",
            "opt-qizili": "Gold",
            "opt-gumushu": "Silver",
            "opt-boz": "Grey",
            "opt-mavi": "Blue",
            "opt-diger": "Other",
            "opt-brand-placeholder": "Select a category first",
            "opt-model-placeholder-cat": "Select a category first",
            "opt-model-placeholder-brand": "Select a model",
            "opt-diger-brand": "Other",
            "opt-diger-model": "Other model",
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
            "fav-empty-desc": "No ads have been added to favorites yet.",
            "fav-empty-link": "View ads",
            "fav-count-text": "ads have been added to favorites",
            "fav-select-all": "Select all",
            "fav-delete-selected": "Delete selected",
            "fav-delete-all": "Delete all",
            "fav-delete-confirm": "Are you sure you want to delete all favorite ads?",
            // Rules page
            "rules-page-h1": "Rules & Safety",
            "rules-page-sub": "Read these rules to use our platform safely and comfortably.",
            "rules-tab-general": "General Rules",
            "rules-tab-posting": "Ad Posting",
            "rules-tab-safety": "Safety",
            "rules-tab-prohibited": "Prohibited",
            "rules-h2-general": "General Terms of Use",
            "rules-g1": "The platform is intended only for buying and selling mobile phones, tablets, headphones, and phone accessories.",
            "rules-g2": "To register, you must enter real personal information (name, surname, phone number).",
            "rules-g3": "Each user can have only one account. Multiple accounts will be blocked.",
            "rules-g4": "All ads placed on the platform go through moderation. Inappropriate ads will be deleted.",
            "rules-g5": "The ad duration is 30 days. Expired ads are automatically archived.",
            "rules-g6": "It is strictly forbidden to post the same ad multiple times. Such ads will be systematically deleted.",
            "rules-h2-posting": "Ad Posting Rules",
            "rules-p1": "Place the ad in the correct category: Phones, Tablets, Headphones, or Accessories.",
            "rules-p2": "Don't write prices in the title — there's a price field for that. These types of posts should be edited.",
            "rules-p3": "State the actual condition of the product: New, Used, etc. Misleading information is prohibited.",
            "rules-p4": "Add at least 1, max 10 high-quality photos. The size of each photo should not exceed 5MB.",
            "rules-p5": "Do not include phone numbers, email addresses, or website links in photos, titles, or descriptions.",
            "rules-p6": "Honestly state the technical features of the product (memory, color, NFC, water resistance, etc.).",
            "rules-p7": "For products with a warranty, the warranty period must be specified.",
            "rules-p8": "Prices must be shown in AZN (Azerbaijani Manat). Indicating prices in other currencies is forbidden.",
            "rules-p9": "There is an active ad limit for each category. Premium packages increase this limit.",
            "rules-p10": "All notifications regarding your ad will be sent to the email address you used during registration.",
            "rules-h2-safety": "Safety Recommendations",
            "safety-c1-h": "Meet in person",
            "safety-c1-p": "Whenever possible, meet the buyer/seller in a public place during the day. Avoid meeting in dark or secluded areas.",
            "safety-c2-h": "Check the product",
            "safety-c2-p": "Before buying, check the phone's IMEI code, battery health, screen, and all available features.",
            "safety-c3-h": "Payment",
            "safety-c3-p": "Make payment only after receiving the product and in person. Avoid making advance payments.",
            "safety-c4-h": "Report suspicious ads",
            "safety-c4-p": "Immediately report any suspicious or misleading ad to moderators using the 'Report' button.",
            "safety-warning": "Warning: Mobil.az never requests your password or bank card information via SMS, email, or a phone call. Reject such requests immediately.",
            "rules-h2-prohibited": "Prohibited Activities",
            "rules-pr1": "Selling stolen, fake, or undocumented products is prohibited. Such ads will be removed, accounts blocked, and law enforcement notified.",
            "rules-pr2": "Posting ads using pictures, names, or brand logos of others without permission is prohibited.",
            "rules-pr3": "The use of misleading prices, fake technical specifications, and false photos is prohibited.",
            "rules-pr4": "Abusive, discriminatory, or aggressive communication towards other users is strictly prohibited.",
            "rules-pr5": "Spam ads and the systematic reposting of the same ad are prohibited.",
            // Privacy page
            "privacy-page-h1": "Privacy Policy",
            "privacy-page-sub": "Mobil.az considers protecting the privacy of our users as a principle.",
            "privacy-updated": "Last updated: March 2025",
            "privacy-h2-collect": "What Data Do We Collect?",
            "privacy-h2-use": "How Do We Use the Data?",
            "privacy-h2-share": "Do We Share Data?",
            "privacy-h2-cookies": "Cookies",
            "privacy-h2-rights": "User Rights",
            "privacy-h2-security": "Data Security",
            "privacy-h2-changes": "Changes to Policy",
            "privacy-h2-contact": "Contact Us",
            "privacy-p-collect": "When registering on Mobil.az, we need to collect the following information:",
            "privacy-collect-1": "Name, surname — to personalize and identify your account.",
            "privacy-collect-2": "Phone number — for contacting regarding ads and account verification.",
            "privacy-collect-3": "E-mail address — to send notifications, password resets, and system information.",
            "privacy-collect-4": "Ad data you post (pictures, description, price, product specifications).",
            "privacy-collect-5": "Technical info: IP address, browser type, platform activity logs.",
            "privacy-p-use": "The information we collect is used for the following purposes:",
            "privacy-use-1": "To create, manage and protect your account.",
            "privacy-use-2": "To place and display your ads on the platform.",
            "privacy-use-3": "To facilitate communication between buyer and seller.",
            "privacy-use-4": "To detect suspicious activities and ensure platform security.",
            "privacy-use-5": "To send notifications about your ads and account status.",
            "privacy-use-6": "To conduct statistical analysis to improve our service (personal data anonymously).",
            "privacy-p-share1": "Mobil.az does not sell your personal information to third parties. Information may only be shared in the following cases:",
            "privacy-share-1": "When required by law (court order, law enforcement request).",
            "privacy-share-2": "With service providers (hosting, e-mail delivery) — only within the scope of service.",
            "privacy-share-3": "With our business partners to protect the platform in case of fraud.",
            "privacy-note-share": "The phone number you provide in your ad can be seen by all users viewing the ad. You choose whether to display your phone number in the ad or not.",
            "privacy-p-cookies1": "Mobil.az uses cookies for our website to function properly. Cookies are small data files stored on your browser.",
            "privacy-p-cookies2": "The cookies we use:",
            "privacy-cookie-1": "<strong>Session cookies:</strong> Deleted after you close the site. Used to maintain login status.",
            "privacy-cookie-2": "<strong>Persistent cookies:</strong> Used to remember your preferences like language choice and dark mode.",
            "privacy-p-cookies3": "You can refuse to accept cookies by changing your browser settings, but in this case, some functions may not work properly.",
            "privacy-p-rights": "You have the following rights regarding your data:",
            "privacy-right-1": "The right to view and update your personal information in your account.",
            "privacy-right-2": "The right to completely delete your account — in this case, all your data is deleted from the system.",
            "privacy-right-3": "The right to opt-out of marketing notifications.",
            "privacy-right-4": "The right to object to the processing of your data (within legal grounds).",
            "privacy-rights-note": "To exercise these rights, you can contact us via the e-mail address below.",
            "privacy-p-security1": "The security of your data is our top priority. Mobil.az takes necessary security measures to protect users' data. Passwords are stored securely using cryptographic methods.",
            "privacy-p-security2": "However, no internet platform can guarantee 100% security. Do not share your password with anyone and use a strong, unique password.",
            "privacy-p-changes": "This privacy policy may be updated from time to time. You will be notified via e-mail when there are significant changes. For maximum transparency, we recommend checking this page regularly.",
            "privacy-p-contact": "If you have any questions about our privacy policy, please contact us:",
            "privacy-contact-email-h": "E-mail",
            "privacy-contact-phone-h": "Phone",
            "stores-h1": "Discover your favorite stores",
            "stores-p": "We have gathered the best stores for you",
            "stores-search-placeholder": "Search store...",
            "stores-search-btn": "Search",
            "stores-add-btn": "Open a store",
            "stores-view-btn": "View store",
            "stores-contact-btn": "Contact",
            // Create Shop page
            "cs-hero-h1": "Open Your Own Store",
            "cs-hero-p": "Leverage the power of Mobil.az — reach thousands of buyers, manage your listings, and grow your business.",
            "cs-badge-fast": "Quick Registration",
            "cs-badge-users": "Daily Growing User Base",
            "cs-badge-safe": "Secure & Official",
            "cs-pkg-chip": "Packages",
            "cs-pkg-h2": "Choose the Right Package for Your Business",
            "cs-pkg-sub": "All packages start with a 30-day free trial. Change anytime.",
            "cs-pkg-select": "Choose Plan",
            "cs-popular-badge": "Most Popular",
            "cs-starter-name": "Starter",
            "cs-starter-tag": "Ideal for small sellers",
            "cs-starter-price": "Free",
            "cs-starter-period": "For beginners · No charge",
            "cs-starter-f1": "5 active listings",
            "cs-starter-f2": "Basic store profile",
            "cs-starter-f3": "Listed on Mobil.az",
            "cs-starter-f4": "No official store badge",
            "cs-starter-f5": "No featured ad support",
            "cs-starter-f6": "No analytics panel",
            "cs-pro-name": "Pro Store",
            "cs-pro-tag": "For active businesses",
            "cs-monthly": "/ mo · monthly billing",
            "cs-pro-f1": "50 active listings",
            "cs-pro-f2": "Official store badge",
            "cs-pro-f3": "5 featured ads per month",
            "cs-pro-f4": "Priority search ranking",
            "cs-pro-f5": "Analytics panel",
            "cs-pro-f6": "WhatsApp integration",
            "cs-elite-tag": "Large stores & distributors",
            "cs-elite-f1": "Unlimited listings",
            "cs-elite-f2": "Premium gold badge 👑",
            "cs-elite-f3": "Unlimited featured ads",
            "cs-elite-f4": "Homepage banner ad",
            "cs-elite-f5": "Detailed analytics & reports",
            "cs-elite-f6": "Dedicated support (7/24)",
            "cs-form-chip": "Registration",
            "cs-form-h2": "Enter Your Store Details",
            "cs-form-sub": "Fill in the form below and our team will contact you.",
            "cs-form-pkg-default": "Pro Store plan selected",
            "cs-form-pkg-hint": "Select a package above to change",
            "cs-lbl-store-name": "Store Name *",
            "cs-ph-store-name": "E.g.: LeadTech Mobile",
            "cs-lbl-owner": "Owner's Full Name *",
            "cs-ph-owner": "E.g.: Ali Mammadov",
            "cs-lbl-phone": "Contact Number *",
            "cs-lbl-email": "Email *",
            "cs-ph-email": "store@example.com",
            "cs-lbl-category": "Store Category *",
            "cs-ph-category": "Select category",
            "cs-cat-phones": "Smartphones",
            "cs-cat-accessories": "Accessories",
            "cs-cat-tablets": "Tablets",
            "cs-cat-repair": "Repair & Service",
            "cs-lbl-address": "Address *",
            "cs-ph-address": "Street, building, store number...",
            "cs-lbl-desc": "About the Store *",
            "cs-ph-desc": "Brief info about your store, products, and warranty terms...",
            "cs-lbl-logo": "Store Logo",
            "cs-logo-click": "Click to upload image",
            "cs-logo-drag": "or drag & drop",
            "cs-logo-max": "Max. 5 MB",
            "cs-lbl-whatsapp": "WhatsApp Number",
            "cs-lbl-instagram": "Instagram Link",
            "cs-ph-instagram": "https://instagram.com/store",
            "cs-optional": "(Optional)",
            "cs-submit": "Open My Store",
            "cs-form-note": "By submitting the form, you agree to our <a href='rules.html'>Rules</a> and <a href='privacy.html'>Privacy Policy</a>.",
            "cs-lbl-city": "City *",
            "cs-ph-city": "Select city",
            "cs-ben-chip": "Benefits",
            "cs-ben-h2": "Why Mobil.az?",
            "cs-ben1-h": "Growing Buyer Base",
            "cs-ben1-p": "Introduce your store to active buyers who visit our platform every day.",
            "cs-ben2-h": "Track Your Sales",
            "cs-ben2-p": "Monitor views, clicks, and customer behavior with the analytics panel.",
            "cs-ben3-h": "Fully Mobile-Friendly",
            "cs-ben3-p": "Your customers can easily access your store from any device.",
            "cs-ben4-h": "Support Team",
            "cs-ben4-p": "Our professional support team is always here for any questions you have.",
            "cs-elite-name": "Premium",
            "elan-badge": "Active",
            "elan-subtitle": "Deliver your phone, tablet, headphones and accessories quickly to the right buyer",
            "elan-stat-safe": "Safe platform",
            "elan-stat-free": "Free ad",
            "elan-stat-days": "30 days active",
            "elan-step1": "Details",
            "elan-step2": "Photos",
            "elan-step3": "Publish",
            "elan-section1": "Basic info",
            "elan-region": "Region *",
            "elan-section2": "Technical Specs",
            "elan-features-label": "Features",
            "elan-chip-nfc": "NFC",
            "elan-chip-fingerprint": "Fingerprint",
            "elan-chip-waterproof": "Waterproof",
            "elan-chip-expandable": "Extra memory",
            "elan-chip-delivery": "Delivery",
            "elan-section3": "Description & Photos",
            "elan-upload-text": "Drag photos here or",
            "elan-upload-span": "select",
            "elan-section4": "Contact Info",
            "elan-submit-note": "Your ad will be moderated before publishing.",
            "elan-tip-title": "Tip",
            "elan-tip-text": "High-quality photos help sell your item 3x faster. Add at least 4-6 photos.",
            "filter-memory-label": "Storage (ROM)",
            "filter-ram-label": "RAM",
            "ram-2gb": "2 GB",
            "ram-4gb": "4 GB",
            "ram-6gb": "6 GB",
            "ram-8gb": "8 GB",
            "ram-12gb": "12 GB",
            "ram-16gb": "16 GB+",
            "filter-screen-label": "Screen size",
            "screen-small": "<5.5\"",
            "screen-medium": "5.5–6.1\"",
            "screen-large": "6.1–6.7\"",
            "screen-xlarge": ">6.7\"",
            "filter-battery-label": "Battery",
            "battery-low": "<3000 mAh",
            "battery-mid": "3000–4500 mAh",
            "battery-high": ">4500 mAh",
            "filter-seller-label": "Seller type",
            "seller-private": "Private",
            "seller-store": "Store",
            "filter-category-label": "Category",
            "filter-cat-all": "All",
            "filter-cat-phone": "Phones",
            "filter-cat-tablet": "Tablets",
            "filter-cat-headphone": "Headphones",
            "filter-cat-accessory": "Accessories",
            "cabinet-title": "Personal Cabinet",
            "cab-profile": "Profile",
            "cab-my-ads": "My Ads",
            "cab-messages": "Messages",
            "cab-settings": "Settings",
            "cab-logout": "Logout",
            "cab-welcome": "Welcome,",
            "cab-active-ads": "Active ads",
            "cab-total-views": "Total views",
            "cab-favorites": "Favorites",
            "cab-personal-info": "Personal Info",
            "cab-edit-btn": "Edit",
            "cab-name-lbl": "Name:",
            "cab-surname-lbl": "Surname:",
            "cab-phone-lbl": "Phone:",
            "cab-email-lbl": "Email:",
            "fav-empty-desc": "No ads have been added to favorites yet.",
            "fav-empty-link": "View ads",
            "fav-count-text": "ads added to favorites",
            "fav-select-all": "Select All",
            "fav-delete-selected": "Delete Selected",
            "fav-delete-all": "Delete All",
            "fav-delete-confirm": "Are you sure you want to delete all favorite ads?",
            "cs-lbl-payment": "Payment Method *",
            "cs-pay-card": "Bank Card",
            "cs-pay-card-sub": "Online payment (Visa/MasterCard)",
            "cs-pay-transfer": "Bank Transfer",
            "cs-pay-transfer-sub": "Payment to company account",
            "cs-pay-terminal": "Terminal",
            "cs-pay-terminal-sub": "eManat / MilliÖn",
            "cs-pay-card-details": "Card Details",
            "cs-lbl-card-num": "Card Number",
            "cs-lbl-card-exp": "Expiration Date",
            "cs-lbl-card-cvv": "CVV",
            "cs-pay-transfer-details": "Transfer Details",
            "cs-pay-transfer-info": "Please make the payment to the following account and enter your TIN:",
            "cs-lbl-voen": "Your TIN / Invoice",
            "cs-pay-terminal-details": "Terminal (MilliÖn / eManat)",
            "cs-pay-terminal-info": "After making the payment via terminal, enter the receipt number.",
            "cs-lbl-receipt": "Receipt Number",
            // Ad Detail page
            "det-badge-new": "New",
            "det-condition-label": "Condition:",
            "det-city-label": "City:",
            "det-delivery-label": "Delivery:",
            "det-delivery-yes": "Available",
            "det-delivery-no": "Not available",
            "det-price-note": "Fixed price · Barter available",
            "det-spec-storage": "Storage",
            "det-spec-screen": "Screen size",
            "det-spec-refresh": "Refresh rate",
            "det-spec-battery": "Battery",
            "det-spec-processor": "Processor",
            "det-spec-cam-rear": "Camera (rear)",
            "det-spec-cam-front": "Camera (front)",
            "det-spec-color": "Color",
            "det-spec-condition": "Condition",
            "det-spec-waterproof": "Water resistance",
            "det-feat-fingerprint": "Fingerprint",
            "det-feat-waterproof-chip": "IP68 Waterproof",
            "det-feat-no-expandable": "No expandable storage",
            "det-spec-included": "✓ Included",
            "det-spec-available": "✓ Available",
            "det-specs-title": "Technical Specifications",
            "det-desc-title": "Seller's Description",
            "det-reviews-title": "Seller Reviews",
            "det-reviews-based": "reviews",
            "det-write-review-title": "Write Your Review",
            "det-review-name-ph": "Your name (e.g. Ali M.)",
            "det-review-text-ph": "Share your experience with the seller...",
            "det-review-submit": "Submit Review",
            "det-ad-no": "Ad No:",
            "det-posted": "Posted:",
            "det-updated": "Updated:",
            "det-seller-personal": "Personal account",
            "det-seller-since": "Member since:",
            "det-ads-shared": "Ads shared",
            "det-rating": "★ Rating",
            "det-positive": "Positive reviews",
            "det-btn-call": "Show Number",
            "det-btn-whatsapp": "Message on WhatsApp",
            "det-btn-message": "Send Message",
            "det-sidebar-review-title": "Write a positive review",
            "det-sidebar-review-ph": "Your review about this seller...",
            "det-safety-title": "Safe Purchase",
            "det-safety-1": "Meet in a public place if possible",
            "det-safety-2": "Check the IMEI code before buying",
            "det-safety-3": "Avoid advance payments",
            "det-safety-4": "Report suspicious ads",
            "det-btn-share": "Share",
            "det-btn-report": "Report",
            "det-related-title": "Similar Ads",
            "det-breadcrumb-home": "Home",
            "det-breadcrumb-phones": "Phones",
            // Monetization
            "mon-bump": "Bump Up",
            "mon-vip": "VIP",
            "mon-pro": "PRO",
            "mon-1day": "1 Day",
            "mon-3day": "3 Days",
            "mon-referral-title": "Refer a friend, get 5 AZN!",
            "mon-referral-desc": "For each friend who registers, you'll receive 5 AZN credit.",
            "mon-copy-link": "Copy link",
            "mon-referral-credit": "Referral balance",
            "mon-promote-ad": "Promote Ad",
            "mon-package": "Package",
            "mon-duration": "Duration",
            "mon-total": "Total",
            "mon-use-credit": "Use referral credit (max 50%)",
            "mon-pay-btn": "Pay now"
        },
        RUS: {
            Contact: "Контакт",
            About: "О нас",
            Stores: "Магазины",
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
            "all-models": "Все модели",
            "other-model": "Другая модель",
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
            "faq-q1": "Размещение объявления на Mobil.az платное?",
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
            "about-h1": "Mobil.az — Новый адрес телефонных объявлений в Азербайджане!",
            "about-sub": "Специализированный маркетплейс только для телефонов!",
            "about-p1": "Инновационная платформа под названием <b style=\"color: blueviolet;\">Mobil.az</b> знаменует собой начало нового этапа развития сектора электронной коммерции Азербайджанской Республики. Это современное решение, в отличие от традиционных досок, привлекает внимание своим специализированным подходом.",
            "about-p2": "Пользователи могут размещать объявления как о новых, так и о бывших в употреблении устройствах.",
            "about-p3": "Наша платформа охватывает товары в разных ценовых категориях и предлагает варианты на любой бюджет.",
            "about-h2-1": "Что можно продавать на Mobil.az?",
            "about-ul1-1": "Новые и б/у смартфоны, все бренды и ценовые категории",
            "about-ul1-2": "Модели планшетов от Apple, Samsung, Xiaomi и других производителей",
            "about-ul1-3": "Проводные и беспроводные наушники, аудиоаксессуары",
            "about-ul1-4": "Адаптеры, защитные чехлы, защитные стекла и многое другое",
            "about-category-summary": "И покупатели, и продавцы легко решают свои задачи на Mobil.az. Разместите объявление бесплатно, найдите покупателя.",
            "about-h2-2": "Почему именно Mobil.az?",
            "about-ul2-1": "Специализированный рынок - платформа посвящена только купле-продаже мобильных телефонов и аксессуаров.",
            "about-ul2-2": "Удобство для пользователей - благодаря системам поиска и фильтров вы можете найти любую модель.",
            "about-ul2-3": "Самая современная и безопасная торговля - существует система рейтингов и комментариев для продавцов.",
            "about-ul2-4": "Различные рекламные пакеты - пользователи могут использовать стандарты PRO и VIP в соответствии со своими потребностями.",
            "about-h2-3": "Как работает Mobil.az?",
            "about-p4": "Наша платформа создает благоприятную среду продаж как для индивидуальных продавцов, так и для магазинов.",
            "about-h3-1": "1. Для индивидуальных продавцов",
            "about-ul3-1": "Любой - каждый, кто хочет продать свой телефон, может разместить бесплатное или PRO объявление.",
            "about-ul3-2": "Прямой контакт с покупателем - продавцы могут общаться с покупателями.",
            "about-ul3-3": "Широкие возможности поиска.",
            "about-h3-2": "2. Для магазинов",
            "about-ul4-1": "Магазины телефонов - зарегистрировавшись на Mobil.az, они могут открывать свои брендовые магазины.",
            "about-ul4-2": "Премиум функции для компаний.",
            "about-ul4-3": "Бренд витрина - компании могут представить свою продукцию более широкой аудитории.",
            "about-h2-4": "Планы на будущее и развитие",
            "about-ul5-1": "Будет запущено мобильное приложение Mobil.az.",
            "about-ul5-2": "Интеллектуальное размещение объявлений и улучшенная система поиска будут созданы с интеграцией искусственного интеллекта (ИИ).",
            "about-ul5-3": "Система автоматической проверки рекламы.",
            "about-p5": "Mobil.az — новая платформа объявлений в Азербайджане, ориентированная только на продажу телефонов и аксессуаров.",
            "about-tagline": "Mobil.az – Новый адрес торговли телефонами!",
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
            "elan-ram": "ОЗУ (ГБ)",
            "elan-screen": "Размер экрана",
            "elan-battery": "Батарея (mAh)",
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
            // Rules page
            "rules-page-h1": "Правила и безопасность",
            "rules-page-sub": "Прочитайте эти правила, чтобы безопасно и удобно пользоваться нашей платформой.",
            "rules-tab-general": "Общие правила",
            "rules-tab-posting": "Размещение объявлений",
            "rules-tab-safety": "Безопасность",
            "rules-tab-prohibited": "Запрещено",
            "rules-h2-general": "Общие правила использования",
            "rules-g1": "Платформа предназначена исключительно для купли-продажи мобильных телефонов, планшетов, наушников и аксессуаров.",
            "rules-g2": "Для регистрации необходимо указать реальные личные данные (имя, фамилию, номер телефона).",
            "rules-g3": "У каждого пользователя может быть только одна учетная запись. Множественные аккаунты будут заблокированы.",
            "rules-g4": "Все размещаемые на платформе объявления проходят модерацию. Несоответствующие правила объявления удаляются.",
            "rules-g5": "Срок действия объявления составляет 30 дней. По истечении этого срока объявления автоматически архивируются.",
            "rules-g6": "Строго запрещено многократное размещение одного и того же объявления. Подобные объявления будут систематически удаляться.",
            "rules-h2-posting": "Правила размещения объявлений",
            "rules-p1": "Размещайте объявление в правильной категории: Телефоны, Планшеты, Наушники или Аксессуары.",
            "rules-p2": "Не пишите цену в заголовке — для этого есть отдельное поле. Такие объявления должны быть отредактированы.",
            "rules-p3": "Укажите реальное состояние товара: Новый, Б/у и т.д. Предоставление ложной информации запрещено.",
            "rules-p4": "Добавьте как минимум 1, максимум 10 качественных фотографий. Размер каждой фотографии не должен превышать 5 МБ.",
            "rules-p5": "Не указывайте номера телефонов, адреса электронной почты или ссылки на сайты на фотографиях, в заголовках или описаниях.",
            "rules-p6": "Честно указывайте технические характеристики продукта (память, цвет, NFC, водонепроницаемость и т.д.).",
            "rules-p7": "Для товаров на гарантии обязательно должен быть указан гарантийный срок.",
            "rules-p8": "Цена должна быть указана в азн (азербайджанских манатах). Размещение цен в другой валюте запрещено.",
            "rules-p9": "Для каждой категории существует ограничение на количество активных объявлений. Премиум-пакеты увеличивают этот лимит.",
            "rules-p10": "Все уведомления, касающиеся вашего объявления, будут отправляться на адрес электронной почты, указанный при регистрации.",
            "rules-h2-safety": "Рекомендации по безопасности",
            "safety-c1-h": "Личные встречи",
            "safety-c1-p": "По возможности встречайтесь с покупателем/продавцом в общественном месте в дневное время. Избегайте встреч в темных или безлюдных местах.",
            "safety-c2-h": "Проверяйте товар",
            "safety-c2-p": "Перед покупкой проверьте IMEI код телефона, состояние батареи, экран и все доступные функции.",
            "safety-c3-h": "Оплата",
            "safety-c3-p": "Осуществляйте оплату только после получения товара лично. Избегайте предоплат.",
            "safety-c4-h": "Сообщайте о подозрительных объявлениях",
            "safety-c4-p": "Немедленно сообщайте о любых подозрительных или вводящих в заблуждение объявлениях модераторам с помощью кнопки «Пожаловаться».",
            "safety-warning": "Внимание: Mobil.az никогда не запрашивает ваш пароль или данные банковской карты через SMS, e-mail или звонки. Немедленно отклоняйте такие запросы.",
            "rules-h2-prohibited": "Запрещенные действия",
            "rules-pr1": "Продажа украденных, поддельных или нелегальных товаров запрещена. Такие объявления удаляются, аккаунт блокируется, а правоохранительные органы уведомляются.",
            "rules-pr2": "Размещение объявлений с использованием чужих фотографий, имен или логотипов брендов без разрешения запрещено.",
            "rules-pr3": "Использование вводящих в заблуждение цен, ложных технических характеристик и несоответствующих фотографий строго запрещено.",
            "rules-pr4": "Оскорбительное, дискриминационное или агрессивное общение по отношению к другим пользователям запрещено.",
            "rules-pr5": "Спам-объявления и систематическое повторное размещение одного и того же объявления запрещены.",
            // Privacy page
            "privacy-page-h1": "Политика конфиденциальности",
            "privacy-page-sub": "Mobil.az считает защиту конфиденциальности пользователей принципом.",
            "privacy-updated": "Последнее обновление: Март 2025",
            "privacy-h2-collect": "Какие данные мы собираем?",
            "privacy-h2-use": "Как мы используем данные?",
            "privacy-h2-share": "Передаём ли мы данные?",
            "privacy-h2-cookies": "Файлы Cookie",
            "privacy-h2-rights": "Права пользователя",
            "privacy-h2-security": "Безопасность данных",
            "privacy-h2-changes": "Изменения в политике",
            "privacy-h2-contact": "Свяжитесь с нами",
            "privacy-p-collect": "При регистрации на Mobil.az нам необходимо собирать следующую информацию:",
            "privacy-collect-1": "Имя, фамилия — для персонализации и идентификации вашей учетной записи.",
            "privacy-collect-2": "Номер телефона — для связи по объявлениям и проверки учетной записи.",
            "privacy-collect-3": "E-mail адрес — для отправки уведомлений, сброса пароля и информации от системы.",
            "privacy-collect-4": "Данные объявлений, которые вы размещаете (фотографии, описание, цена, характеристики товара).",
            "privacy-collect-5": "Техническая информация: IP-адрес, тип браузера, журналы активности платформы.",
            "privacy-p-use": "Собранная нами информация используется в следующих целях:",
            "privacy-use-1": "Для создания, управления и защиты вашей учетной записи.",
            "privacy-use-2": "Для размещения и отображения ваших объявлений на платформе.",
            "privacy-use-3": "Для облегчения общения между покупателем и продавцом.",
            "privacy-use-4": "Для обнаружения подозрительных действий и обеспечения безопасности платформы.",
            "privacy-use-5": "Для отправки уведомлений о статусе ваших объявлений и учетной записи.",
            "privacy-use-6": "Для проведения статистического анализа с целью улучшения нашего сервиса (личные данные используются анонимно).",
            "privacy-p-share1": "Mobil.az не продает вашу личную информацию третьим лицам. Информация может быть передана только в следующих случаях:",
            "privacy-share-1": "По требованию законодательства (решение суда, запрос правоохранительных органов).",
            "privacy-share-2": "Поставщикам услуг (хостинг, рассылка электронной почты) — только в рамках оказания услуг.",
            "privacy-share-3": "Нашим деловым партнерам для защиты платформы от мошенничества.",
            "privacy-note-share": "Номер телефона, указанный в вашем объявлении, могут видеть все пользователи, просматривающие это объявление. Вы сами выбираете, показывать номер телефона в объявлении или нет.",
            "privacy-p-cookies1": "Mobil.az использует файлы cookie для правильной работы веб-сайта. Файлы cookie — это небольшие файлы данных, которые хранятся в вашем браузере.",
            "privacy-p-cookies2": "Файлы cookie, которые мы используем:",
            "privacy-cookie-1": "<strong>Сессионные файлы cookie:</strong> Удаляются после закрытия сайта. Используются для сохранения статуса входа.",
            "privacy-cookie-2": "<strong>Постоянные файлы cookie:</strong> Используются для запоминания ваших предпочтений, таких как выбор языка и темный режим.",
            "privacy-p-cookies3": "Вы можете отказаться от использования файлов cookie, изменив настройки своего браузера, но в этом случае некоторые функции могут работать некорректно.",
            "privacy-p-rights": "Вы имеете следующие права в отношении ваших данных:",
            "privacy-right-1": "Право просматривать и обновлять свою личную информацию в своей учетной записи.",
            "privacy-right-2": "Право полностью удалить свою учетную запись — в этом случае все ваши данные удаляются из системы.",
            "privacy-right-3": "Право отказаться от получения маркетинговых уведомлений.",
            "privacy-right-4": "Право возражать против обработки ваших данных (на законных основаниях).",
            "privacy-rights-note": "Чтобы воспользоваться этими правами, вы можете связаться с нами по указанному ниже адресу электронной почты.",
            "privacy-p-security1": "Безопасность ваших данных является нашим главным приоритетом. Mobil.az принимает необходимые меры безопасности для защиты данных пользователей. Пароли надежно хранятся с использованием криптографических методов.",
            "privacy-p-security2": "Однако ни одна интернет-платформа не может гарантировать 100% безопасность. Никому не сообщайте свой пароль и используйте надежный, уникальный пароль.",
            "privacy-p-changes": "Эта политика конфиденциальности может время от времени обновляться. При существенных изменениях вы будете уведомлены по электронной почте. Для обеспечения максимальной прозрачности мы рекомендуем регулярно проверять эту страницу.",
            "privacy-p-contact": "Если у вас есть какие-либо вопросы о нашей политике конфиденциальности, пожалуйста, свяжитесь с нами:",
            "privacy-contact-email-h": "E-mail",
            "privacy-contact-phone-h": "Телефон",
            "stores-h1": "Откройте для себя любимые магазины",
            "stores-p": "Мы собрали для вас лучшие магазины",
            "stores-search-placeholder": "Поиск магазина...",
            "stores-search-btn": "Поиск",
            "stores-add-btn": "Открыть магазин",
            "stores-view-btn": "Посмотреть магазин",
            "stores-contact-btn": "Контакт",
            "stores-active-ads": "Активных объявлений",
            "stores-review": "отзывов",
            "stores-nationwide-delivery": "Доставка по стране",
            "stores-barter": "Бартер возможен",
            "stores-warranty": "год Официальная Гарантия",
            // Create Shop page
            "cs-hero-h1": "Откройте свой магазин",
            "cs-hero-p": "Используйте возможности Mobil.az — охватывайте тысячи покупателей, управляйте объявлениями и развивайте бизнес.",
            "cs-badge-fast": "Быстрая регистрация",
            "cs-badge-users": "Ежедневно растущая база",
            "cs-badge-safe": "Безопасно & Официально",
            "cs-pkg-chip": "Пакеты",
            "cs-pkg-h2": "Выберите подходящий пакет",
            "cs-pkg-sub": "Все пакеты начинаются с 30-дневного бесплатного периода. Меняйте в любое время.",
            "cs-pkg-select": "Выбрать план",
            "cs-popular-badge": "Самый популярный",
            "cs-starter-name": "Стартовый",
            "cs-starter-tag": "Идеально для малого бизнеса",
            "cs-starter-price": "Бесплатно",
            "cs-starter-period": "Для начинающих · Без оплаты",
            "cs-starter-f1": "5 активных объявлений",
            "cs-starter-f2": "Базовый профиль магазина",
            "cs-starter-f3": "Отображение на Mobil.az",
            "cs-starter-f4": "Нет официального значка",
            "cs-starter-f5": "Нет поддержки рекламных объявлений",
            "cs-starter-f6": "Нет панели аналитики",
            "cs-pro-name": "Про-магазин",
            "cs-pro-tag": "Для активного бизнеса",
            "cs-monthly": "/ мес · ежемесячная оплата",
            "cs-pro-f1": "50 активных объявлений",
            "cs-pro-f2": "Официальный значок магазина",
            "cs-pro-f3": "5 продвинутых объявлений в месяц",
            "cs-pro-f4": "Приоритет в поиске",
            "cs-pro-f5": "Панель аналитики",
            "cs-pro-f6": "Интеграция WhatsApp",
            "cs-elite-tag": "Крупные магазины & дистрибьюторы",
            "cs-elite-f1": "Неограниченные объявления",
            "cs-elite-f2": "Премиум золотой значок 👑",
            "cs-elite-f3": "Неограниченные продвинутые объявления",
            "cs-elite-f4": "Баннерная реклама на главной",
            "cs-elite-f5": "Подробная аналитика и отчёты",
            "cs-elite-f6": "Выделенная поддержка (7/24)",
            "cs-form-chip": "Регистрация",
            "cs-form-h2": "Введите данные магазина",
            "cs-form-sub": "Заполните форму ниже, и наша команда свяжется с вами.",
            "cs-form-pkg-default": "Выбран план Про-магазин",
            "cs-form-pkg-hint": "Выберите пакет выше для изменения",
            "cs-lbl-store-name": "Название магазина *",
            "cs-ph-store-name": "Напр.: LeadTech Mobile",
            "cs-lbl-owner": "Имя и фамилия владельца *",
            "cs-ph-owner": "Напр.: Али Мамедов",
            "cs-lbl-phone": "Контактный номер *",
            "cs-lbl-email": "E-mail *",
            "cs-ph-email": "magazin@example.com",
            "cs-lbl-category": "Категория магазина *",
            "cs-ph-category": "Выберите категорию",
            "cs-cat-phones": "Смартфоны",
            "cs-cat-accessories": "Аксессуары",
            "cs-cat-tablets": "Планшеты",
            "cs-cat-repair": "Ремонт & Сервис",
            "cs-lbl-address": "Адрес *",
            "cs-ph-address": "Улица, здание, номер магазина...",
            "cs-lbl-desc": "О магазине *",
            "cs-ph-desc": "Краткое описание магазина, продуктов, условий гарантии...",
            "cs-lbl-logo": "Логотип магазина",
            "cs-logo-click": "Нажмите, чтобы загрузить изображение",
            "cs-logo-drag": "или перетащите",
            "cs-logo-max": "Макс. 5 МБ",
            "cs-lbl-whatsapp": "Номер WhatsApp",
            "cs-lbl-instagram": "Ссылка Instagram",
            "cs-ph-instagram": "https://instagram.com/magazin",
            "cs-optional": "(Необязательно)",
            "cs-submit": "Открыть мой магазин",
            "cs-form-note": "Отправляя форму, вы соглашаетесь с <a href='rules.html'>Правилами</a> и <a href='privacy.html'>Политикой конфиденциальности</a>.",
            "cs-lbl-city": "Город *",
            "cs-ph-city": "Выберите город",
            "cs-ben-chip": "Преимущества",
            "cs-ben-h2": "Почему Mobil.az?",
            "cs-ben1-h": "Растущая база покупателей",
            "cs-ben1-p": "Представьте свой магазин активным покупателям, посещающим наш сайт каждый день.",
            "cs-ben2-h": "Отслеживайте продажи",
            "cs-ben2-p": "Следите за просмотрами, кликами и поведением клиентов через панель аналитики.",
            "cs-ben3-h": "Полная мобильность",
            "cs-ben3-p": "Ваши клиенты могут легко зайти в ваш магазин с любого устройства.",
            "cs-ben4-h": "Команда поддержки",
            "cs-ben4-p": "Наша профессиональная команда поддержки всегда готова ответить на ваши вопросы.",
            "cs-elite-name": "Premium",
            "elan-badge": "Активно",
            "elan-subtitle": "Быстро доставляйте телефон, планшет, наушники и аксессуары нужному покупателю",
            "elan-stat-safe": "Безопасная платформа",
            "elan-stat-free": "Бесплатное объявление",
            "elan-stat-days": "Активно 30 дней",
            "elan-step1": "Детали",
            "elan-step2": "Фотографии",
            "elan-step3": "Опубликовать",
            "elan-section1": "Основная информация",
            "elan-region": "Регион *",
            "elan-section2": "Технические характеристики",
            "elan-features-label": "Особенности",
            "elan-chip-nfc": "NFC",
            "elan-chip-fingerprint": "Отпечаток пальца",
            "elan-chip-waterproof": "Водонепроницаемый",
            "elan-chip-expandable": "Доп. память",
            "elan-chip-delivery": "Доставка",
            "elan-section3": "Описание и фотографии",
            "elan-upload-text": "Перетащите фотографии сюда или",
            "elan-upload-span": "выберите",
            "elan-section4": "Контактная информация",
            "elan-submit-note": "Ваше объявление пройдет модерацию перед публикацией.",
            "elan-tip-title": "Совет",
            "elan-tip-text": "Качественные фотографии помогают продать в 3 раза быстрее. Добавьте как минимум 4-6 фото.",
            "filter-memory-label": "Память (ROM)",
            "filter-ram-label": "RAM",
            "ram-2gb": "2 ГБ",
            "ram-4gb": "4 ГБ",
            "ram-6gb": "6 ГБ",
            "ram-8gb": "8 ГБ",
            "ram-12gb": "12 ГБ",
            "ram-16gb": "16 ГБ+",
            "filter-screen-label": "Размер экрана",
            "screen-small": "<5.5\"",
            "screen-medium": "5.5–6.1\"",
            "screen-large": "6.1–6.7\"",
            "screen-xlarge": ">6.7\"",
            "filter-battery-label": "Батарея",
            "battery-low": "<3000 мАч",
            "battery-mid": "3000–4500 мАч",
            "battery-high": ">4500 мАч",
            "filter-seller-label": "Тип продавца",
            "seller-private": "Частное",
            "seller-store": "Магазин",
            "filter-category-label": "Категория",
            "filter-cat-all": "Все",
            "filter-cat-phone": "Телефоны",
            "filter-cat-tablet": "Планшеты",
            "filter-cat-headphone": "Наушники",
            "filter-cat-accessory": "Аксессуары",
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
            "cab-edit-btn": "Редактировать",
            "cab-name-lbl": "Имя:",
            "cab-surname-lbl": "Фамилия:",
            "cab-phone-lbl": "Телефон:",
            "cab-email-lbl": "Эл. почта:",
            "fav-empty-desc": "Пока нет объявлений, добавленных в избранное.",
            "fav-empty-link": "Посмотреть объявления",
            "fav-count-text": "объявлений добавлено в избранное",
            "fav-select-all": "Выбрать все",
            "fav-delete-selected": "Удалить выбранные",
            "fav-delete-all": "Удалить все",
            "fav-delete-confirm": "Вы уверены, что хотите удалить все избранные объявления?",
            "cs-lbl-payment": "Способ оплаты *",
            "cs-pay-card": "Банковская Карта",
            "cs-pay-card-sub": "Онлайн оплата (Visa/MasterCard)",
            "cs-pay-transfer": "Банковский Перевод",
            "cs-pay-transfer-sub": "Оплата на счет компании",
            "cs-pay-terminal": "Терминал",
            "cs-pay-terminal-sub": "eManat / MilliÖn",
            "cs-pay-card-details": "Реквизиты карты",
            "cs-lbl-card-num": "Номер Карты",
            "cs-lbl-card-exp": "Срок Действия",
            "cs-lbl-card-cvv": "CVV",
            "cs-pay-transfer-details": "Данные Перевода",
            "cs-pay-transfer-info": "Пожалуйста, произведите оплату на следующий счет и введите ваш ИНН:",
            "cs-lbl-voen": "Ваш ИНН",
            "cs-pay-terminal-details": "Терминал (MilliÖn / eManat)",
            "cs-pay-terminal-info": "После оплаты через терминал введите номер квитанции.",
            "cs-lbl-receipt": "Номер Квитанции",
            "opt-telefon": "Телефон",
            "opt-planshet": "Планшет",
            "opt-aksesuar": "Аксессуар",
            "opt-headphone": "Наушники",
            "opt-yeni": "Новый",
            "opt-islenmiş": "Б/У",
            "opt-64-az": "Менее 64 ГБ",
            "opt-64": "64 ГБ",
            "opt-128": "128 ГБ",
            "opt-256": "256 ГБ",
            "opt-512": "512 ГБ",
            "opt-512-cox": "Более 512 ГБ",
            "opt-qara": "Чёрный",
            "opt-ag": "Белый",
            "opt-qizili": "Золотой",
            "opt-gumushu": "Серебристый",
            "opt-boz": "Серый",
            "opt-mavi": "Голубой",
            "opt-diger": "Другой",
            "opt-brand-placeholder": "Сначала выберите категорию",
            "opt-model-placeholder-cat": "Сначала выберите категорию",
            "opt-model-placeholder-brand": "Выберите модель",
            "opt-diger-brand": "Другой",
            "opt-diger-model": "Другая модель",
            // Ad Detail page
            "det-badge-new": "Новый",
            "det-condition-label": "Состояние:",
            "det-city-label": "Город:",
            "det-delivery-label": "Доставка:",
            "det-delivery-yes": "Есть",
            "det-delivery-no": "Нет",
            "det-price-note": "Цена фиксированная · Обмен возможен",
            "det-spec-storage": "Память",
            "det-spec-screen": "Размер экрана",
            "det-spec-refresh": "Частота обновления экрана",
            "det-spec-battery": "Батарея",
            "det-spec-processor": "Процессор",
            "det-spec-cam-rear": "Камера (задняя)",
            "det-spec-cam-front": "Камера (передняя)",
            "det-spec-color": "Цвет",
            "det-spec-condition": "Состояние",
            "det-spec-waterproof": "Водостойкость",
            "det-feat-fingerprint": "Отпечаток пальца",
            "det-feat-waterproof-chip": "IP68 Водостойкий",
            "det-feat-no-expandable": "Нет доп. памяти",
            "det-spec-included": "✓ Включено",
            "det-spec-available": "✓ Есть",
            "det-specs-title": "Технические Характеристики",
            "det-desc-title": "Описание продавца",
            "det-reviews-title": "Отзывы о продавце",
            "det-reviews-based": "отзывов",
            "det-write-review-title": "Написать отзыв",
            "det-review-name-ph": "Ваше имя (напр. Али М.)",
            "det-review-text-ph": "Поделитесь опытом работы с продавцом...",
            "det-review-submit": "Отправить отзыв",
            "det-ad-no": "Объявление №:",
            "det-posted": "Опубликовано:",
            "det-updated": "Обновлено:",
            "det-seller-personal": "Личный аккаунт",
            "det-seller-since": "Участник с:",
            "det-ads-shared": "Объявлений",
            "det-rating": "★ Рейтинг",
            "det-positive": "Положительных отзывов",
            "det-btn-call": "Показать номер",
            "det-btn-whatsapp": "Написать в WhatsApp",
            "det-btn-message": "Отправить сообщение",
            "det-sidebar-review-title": "Написать положительный отзыв",
            "det-sidebar-review-ph": "Ваш отзыв об этом продавце...",
            "det-safety-title": "Безопасная Покупка",
            "det-safety-1": "По возможности встречайтесь в общественном месте",
            "det-safety-2": "Не покупайте без проверки IMEI кода",
            "det-safety-3": "Избегайте авансовых платежей",
            "det-safety-4": "Сообщите о подозрительном объявлении",
            "det-btn-share": "Поделиться",
            "det-btn-report": "Пожаловаться",
            "det-related-title": "Похожие объявления",
            "det-breadcrumb-home": "Главная",
            "det-breadcrumb-phones": "Телефоны"
        }
    };
    // ─── LANGUAGE SWITCHER ────────────────────────────────────────────────────
    const langSwitcher = document.querySelector(".language-selector");
    const currentLangElement = document.getElementById("current-lang");
    function changeLanguage() {
        if (!currentLangElement)
            return;
        let currentLang = currentLangElement.innerText.trim();
        // Normalise RUS display label back to key
        if (currentLang === "РУС")
            currentLang = "RUS";
        let newLang = currentLang === "AZ" ? "ENG" : currentLang === "ENG" ? "RUS" : "AZ";
        currentLangElement.innerText = translations[newLang]["language-selector"];
        localStorage.setItem("lang", newLang);
        document.querySelectorAll("[data-translate]").forEach((element) => {
            let key = element.getAttribute("data-translate");
            if (!key || !translations[newLang][key])
                return;
            if (element.tagName === "LI") {
                const link = element.querySelector("a");
                if (link) {
                    const icon = link.querySelector("i");
                    link.innerHTML = icon
                        ? icon.outerHTML + " " + translations[newLang][key]
                        : translations[newLang][key];
                }
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
                if (text.includes("<") && text.includes(">")) {
                    element.innerHTML = text;
                }
                else {
                    element.textContent = text;
                }
            }
        });
        const searchInput = document.querySelector(".search-options input");
        if (searchInput) {
            searchInput.placeholder = translations[newLang]["search-placeholder"];
        }
        // Logic for placeholder attributes and select list text
        document.querySelectorAll("[data-translate-placeholder]").forEach((el) => {
            let element = el;
            let key = element.getAttribute("data-translate-placeholder");
            if (key && translations[newLang][key]) {
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
        // Translate <option data-translate-option="key"> elements
        document.querySelectorAll("option[data-translate-option]").forEach((opt) => {
            const key = opt.getAttribute("data-translate-option");
            if (key && translations[newLang][key]) {
                opt.textContent = translations[newLang][key];
            }
        });
        // Also update document.title
        const titleElements = document.querySelectorAll("[data-translate-title]");
        titleElements.forEach(el => {
            let key = el.getAttribute("data-translate-title");
            if (key && translations[newLang][key]) {
                document.title = translations[newLang][key];
            }
        });
        // Notify other scripts (e.g. elan-yerlesdir.js) about the language change
        document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: newLang, t: translations[newLang] } }));
    }
    // Restore saved language on page load
    const savedLang = localStorage.getItem("lang");
    if (savedLang && savedLang !== "AZ") {
        // Temporarily set currentLangElement to trigger correct transition
        if (currentLangElement) {
            if (savedLang === "ENG") {
                currentLangElement.innerText = "AZ";
                changeLanguage(); // AZ → ENG
            }
            else if (savedLang === "RUS") {
                currentLangElement.innerText = "AZ";
                changeLanguage(); // AZ → ENG
                changeLanguage(); // ENG → RUS
            }
        }
    }
    if (langSwitcher) {
        langSwitcher.addEventListener("click", changeLanguage);
    }
    // ─── FILTER TOGGLE ────────────────────────────────────────────────────────
    const filterToggle = document.getElementById("filterToggle");
    const filterBody = document.getElementById("filterBody");
    if (filterToggle && filterBody) {
        filterToggle.addEventListener("click", function () {
            filterBody.classList.toggle("active");
        });
    }
    // ─── FILTER BUTTON GROUPS ─────────────────────────────────────────────────
    // Note: click logic is now handled in JS/filters.js to avoid double toggling.

    // ─── BRAND & MODEL SELECT ─────────────────────────────────────────────────
    const filterBrandSelect = document.getElementById("brandSelect");
    const filterModelSelect = document.getElementById("modelSelect");

    if (filterBrandSelect && filterModelSelect) {
        const CATEGORY_BRANDS = {
            phone: ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "Vivo", "Honor", "Realme", "Nokia"],
            tablet: ["Apple", "Samsung", "Lenovo", "Xiaomi", "Huawei", "Honor", "Microsoft"],
            headphone: ["Apple", "Samsung", "Sony", "JBL", "Marshall", "Beats", "Bose", "Xiaomi", "Huawei", "Sennheiser"],
            accessory: ["Baseus", "Anker", "Ugreen", "Spigen", "Apple", "Samsung", "Hoco", "Borofone", "Joyroom"]
        };

        const PHONE_MODELS = {
            Apple: [
                'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
                'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
                'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
                'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini', 'iPhone 13',
                'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini', 'iPhone 12',
                'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
                'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
                'iPhone SE (3rd gen)', 'iPhone SE (2nd gen)',
                'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
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
                'Galaxy Note 20 Ultra', 'Galaxy Note 20',
            ],
            Xiaomi: [
                'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
                'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13',
                'Xiaomi 12 Pro', 'Xiaomi 12', 'Xiaomi 12 Lite',
                'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
                'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
                'Redmi 13C', 'Redmi 12', 'Redmi 10C',
                'POCO X6 Pro', 'POCO X6', 'POCO X5 Pro', 'POCO X5',
                'POCO M6 Pro', 'POCO M5', 'POCO F5 Pro', 'POCO F5',
            ],
            Huawei: [
                'Pura 70 Ultra', 'Pura 70 Pro+', 'Pura 70 Pro', 'Pura 70',
                'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60',
                'P60 Pro', 'P60 Art', 'P60', 'P50 Pro', 'P50',
                'Nova 12 Pro', 'Nova 12 Ultra', 'Nova 12',
                'Nova 11 Pro', 'Nova 11 Ultra', 'Nova 11',
                'Nova 10 Pro', 'Nova 10 SE', 'Y90', 'Y72', 'Y62',
            ],
            OPPO: [
                'Find X8 Pro', 'Find X8', 'Find X7 Ultra', 'Find X7',
                'Find X6 Pro', 'Find X6',
                'Reno 12 Pro', 'Reno 12 F', 'Reno 12',
                'Reno 11 Pro', 'Reno 11 F', 'Reno 11',
                'Reno 10 Pro+', 'Reno 10 Pro', 'Reno 10',
                'A3 Pro', 'A3', 'A78', 'A77', 'A55',
            ],
            Vivo: [
                'X100 Ultra', 'X100 Pro', 'X100',
                'X90 Pro', 'X90',
                'V30 Pro', 'V30 Lite', 'V30',
                'V29 Pro', 'V29 Lite', 'V29',
                'V27 Pro', 'V27 Lite', 'V27',
                'Y200 Pro', 'Y200', 'Y100', 'Y78', 'Y55', 'Y36',
            ],
            Honor: [
                'Magic 6 Pro', 'Magic 6 Ultimate', 'Magic 6',
                'Magic 5 Pro', 'Magic 5 Ultimate', 'Magic 5',
                '90 Smart', '90', '90 Pro',
                'X9b', 'X8b', 'X7b',
                'Play 8T', 'Play 7T', 'Play 6T',
            ],
            Realme: [
                'GT 6T', 'GT 6', 'GT 5 Pro', 'GT 5',
                '12 Pro+ 5G', '12 Pro 5G', '12 5G',
                '11 Pro+ 5G', '11 Pro 5G', '11 5G',
                'C67', 'C55', 'C53', 'C35', 'C33',
                'Narzo 70 Pro', 'Narzo 60 Pro', 'Narzo 50',
            ],
            Nokia: [
                'Nokia G42', 'Nokia G22', 'Nokia G21', 'Nokia G11',
                'Nokia C32', 'Nokia C22', 'Nokia C12', 'Nokia C12+',
                'Nokia XR21', 'Nokia XR20', 'Nokia 5710 XpressAudio',
            ]
        };

        const TABLET_MODELS = {
            Apple: ['iPad Pro 13 (M4)', 'iPad Pro 11 (M4)', 'iPad Air 13 (M2)', 'iPad Air 11 (M2)', 'iPad (10th gen)', 'iPad mini (6th gen)', 'iPad Pro 12.9 (M2)', 'iPad Pro 11 (M2)'],
            Samsung: ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE+', 'Galaxy Tab S9 FE', 'Galaxy Tab A9+', 'Galaxy Tab A9', 'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8'],
            Lenovo: ['Tab P12 Pro', 'Tab P12', 'Tab P11 Pro', 'Tab P11', 'Tab M11', 'Tab M10 Plus', 'Tab M9', 'Tab M8'],
            Xiaomi: ['Xiaomi Pad 6S Pro', 'Xiaomi Pad 6 Max', 'Xiaomi Pad 6 Pro', 'Xiaomi Pad 6', 'Redmi Pad SE', 'Redmi Pad'],
            Huawei: ['MatePad Pro 13.2', 'MatePad Pro 11', 'MatePad 11.5', 'MatePad 11', 'MatePad SE'],
            Honor: ['Pad 9', 'Pad X9', 'Pad 8', 'Pad X8'],
            Microsoft: ['Surface Pro 9', 'Surface Pro 8', 'Surface Go 3']
        };

        const HEADPHONE_MODELS = {
            Apple: ['AirPods Pro (2nd gen)', 'AirPods (3rd gen)', 'AirPods (2nd gen)', 'AirPods Max'],
            Samsung: ['Galaxy Buds2 Pro', 'Galaxy Buds FE', 'Galaxy Buds2', 'Galaxy Buds Pro', 'Galaxy Buds Live'],
            Sony: ['WH-1000XM5', 'WF-1000XM5', 'WH-1000XM4', 'WF-1000XM4', 'LinkBuds S', 'WH-CH720N'],
            JBL: ['Tour One M2', 'Tour Pro 2', 'Live Pro 2', 'Tune 770NC', 'Tune 720BT', 'Wave Buds', 'Wave Beam'],
            Marshall: ['Major V', 'Major IV', 'Minor III', 'Motif II A.N.C.', 'Monitor II A.N.C.'],
            Beats: ['Beats Studio Pro', 'Beats Fit Pro', 'Beats Studio Buds+', 'Beats Studio Buds', 'Beats Flex'],
            Bose: ['QuietComfort Ultra', 'QuietComfort Earbuds II', 'QuietComfort Headphones'],
            Xiaomi: ['Xiaomi Buds 4 Pro', 'Xiaomi Buds 4', 'Redmi Buds 5 Pro', 'Redmi Buds 5', 'Redmi Buds 4 Active'],
            Huawei: ['FreeBuds Pro 3', 'FreeBuds 5', 'FreeBuds 5i', 'FreeBuds SE 2'],
            Sennheiser: ['MOMENTUM 4', 'MOMENTUM True Wireless 3', 'ACCENTUM', 'CX Plus']
        };

        const ACCESSORY_TYPES = ['Adapter', 'Kabel', 'Powerbank', 'Qab (Case)', 'Qoruyucu şüşə', 'Avtomobil tutacağı', 'Qulaqlıq adapteri', 'Hub/Dock', 'Digər'];
        
        // Listen to category changes to update brand dropdown
        const categoryButtons = document.querySelectorAll('.filter-btn-group[data-group="category"] .category-button');
        
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Determine active category value (if "Hamısı" is clicked it might have empty string)
                // Use setTimeout to ensure this runs after filters.js updates the active class
                setTimeout(() => {
                    const activeCatBtn = document.querySelector('.filter-btn-group[data-group="category"] .filter-pill.active');
                    const category = activeCatBtn ? activeCatBtn.getAttribute('data-value') : '';
                    
                    updateBrandDropdown(category);
                }, 50);
            });
        });

        function updateBrandDropdown(category) {
            const currentLangElement = document.getElementById("current-lang");
            let lang = currentLangElement ? currentLangElement.innerText.trim() : "AZ";
            if (lang === "РУС") lang = "RUS";
            
            const allBrandsText = translations[lang] && translations[lang]["all-brand"] ? translations[lang]["all-brand"] : "Bütün markalar";
            const otherText = translations[lang] && translations[lang]["other"] ? translations[lang]["other"] : "Digər";
            
            const brandLabelSpan = document.querySelector('.filter-group .brand');
            const modelGroup = filterModelSelect.closest('.filter-group');
            
            if (category === 'accessory') {
                if (brandLabelSpan) brandLabelSpan.textContent = lang === 'ENG' ? 'Accessory Type' : (lang === 'RUS' ? 'Тип аксессуара' : 'Aksesuar növü');
                if (modelGroup) modelGroup.style.display = 'none';
                
                filterBrandSelect.innerHTML = `<option value="" class="all-brand" data-translate="all-brand">${lang === 'ENG' ? 'All Types' : (lang === 'RUS' ? 'Все типы' : 'Bütün növlər')}</option>`;
                ACCESSORY_TYPES.forEach(type => {
                    const opt = document.createElement('option');
                    opt.value = type;
                    opt.textContent = type;
                    filterBrandSelect.appendChild(opt);
                });
            } else {
                if (brandLabelSpan) brandLabelSpan.textContent = translations[lang] && translations[lang]["brand"] ? translations[lang]["brand"] : "Marka";
                if (modelGroup) modelGroup.style.display = 'block';
                
                const brandsToLoad = CATEGORY_BRANDS[category] || CATEGORY_BRANDS['phone'];
                filterBrandSelect.innerHTML = `<option value="" class="all-brand" data-translate="all-brand">${allBrandsText}</option>`;
                brandsToLoad.forEach(brand => {
                    const opt = document.createElement('option');
                    opt.value = brand;
                    opt.textContent = brand;
                    filterBrandSelect.appendChild(opt);
                });
                
                const otherOpt = document.createElement('option');
                otherOpt.value = "other";
                otherOpt.innerHTML = `<span class="other" data-translate="other">${otherText}</span>`;
                filterBrandSelect.appendChild(otherOpt);
            }
            
            filterBrandSelect.value = '';
            filterBrandSelect.dispatchEvent(new Event('change'));
        }

        filterBrandSelect.addEventListener("change", function () {
            const selectedBrand = this.value;
            const currentLangElement = document.getElementById("current-lang");
            let lang = currentLangElement ? currentLangElement.innerText.trim() : "AZ";
            if (lang === "РУС") lang = "RUS";
            
            const firstOptText = translations[lang] && translations[lang]["select-brand"] ? translations[lang]["select-brand"] : "Əvvəlcə marka seçin";
            
            filterModelSelect.innerHTML = `<option value=""><span class="select-brand" data-translate="select-brand">${firstOptText}</span></option>`;
            
            // Figure out the active category dictionary
            const activeCatBtn = document.querySelector('.filter-btn-group[data-group="category"] .filter-pill.active');
            const category = activeCatBtn ? activeCatBtn.getAttribute('data-value') : '';
            
            let currentModelDict = PHONE_MODELS;
            if (category === 'tablet') currentModelDict = TABLET_MODELS;
            else if (category === 'headphone') currentModelDict = HEADPHONE_MODELS;
            // accessory uses no models
            
            if (category !== 'accessory') {
                if (selectedBrand && currentModelDict[selectedBrand]) {
                    const allModelsText = translations[lang] && translations[lang]["all-models"] ? translations[lang]["all-models"] : "Bütün modellər";
                    filterModelSelect.innerHTML = `<option value="" class="all-models" data-translate="all-models">${allModelsText}</option>`;
                    currentModelDict[selectedBrand].forEach(model => {
                        const opt = document.createElement("option");
                        opt.value = model;
                        opt.textContent = model;
                        filterModelSelect.appendChild(opt);
                    });
                    
                    const otherModelText = translations[lang] && translations[lang]["other-model"] ? translations[lang]["other-model"] : "Digər model";
                    const otherOpt = document.createElement("option");
                    otherOpt.value = "other";
                    otherOpt.textContent = otherModelText;
                    otherOpt.setAttribute("data-translate", "other-model");
                    filterModelSelect.appendChild(otherOpt);
                } else if (selectedBrand === 'other') {
                const allModelsText = translations[lang] && translations[lang]["all-models"] ? translations[lang]["all-models"] : "Bütün modellər";
                filterModelSelect.innerHTML = `<option value="" class="all-models" data-translate="all-models">${allModelsText}</option>`;
                const otherModelText = translations[lang] && translations[lang]["other-model"] ? translations[lang]["other-model"] : "Digər model";
                const opt = document.createElement("option");
                opt.value = "other";
                opt.textContent = otherModelText;
                    opt.setAttribute("data-translate", "other-model");
                    filterModelSelect.appendChild(opt);
                }
            }
        });
    }

    // ─── RESET FILTERS ────────────────────────────────────────────────────────
    const btnReset = document.querySelector(".btn-reset");
    if (btnReset) {
        btnReset.addEventListener("click", function () {
            // Reset selects
            document.querySelectorAll(".filter-select").forEach(select => {
                select.selectedIndex = 0;
                select.dispatchEvent(new Event("change"));
            });
            // Reset price inputs
            document.querySelectorAll(".price-input").forEach(input => {
                input.value = "";
            });
            // Reset button groups
            document.querySelectorAll(".filter-btn-group").forEach(group => {
                const buttons = group.querySelectorAll("button");
                buttons.forEach(btn => btn.classList.remove("active"));
                // Add default active state to the first button for specific groups
                if (group.classList.contains("fingerprint-buttons") ||
                    group.classList.contains("nfc-buttons") ||
                    group.classList.contains("waterproof-buttons") ||
                    group.classList.contains("expandable-buttons") ||
                    group.classList.contains("condition-buttons") ||
                    group.classList.contains("delivery-buttons") ||
                    group.classList.contains("seller-buttons")) {
                    if (buttons.length > 0) buttons[0].classList.add("active");
                }
            });
            // Clean active filter chips
            const activeFiltersContainer = document.getElementById("activeFiltersContainer");
            if (activeFiltersContainer) activeFiltersContainer.style.display = "none";
            const filterChips = document.getElementById("filterChips");
            if (filterChips) filterChips.innerHTML = "";
            const filterBadge = document.getElementById("filterBadge");
            if (filterBadge) {
                filterBadge.style.display = "none";
                filterBadge.textContent = "0";
            }
        });
    }

    // ─── SORTING ──────────────────────────────────────────────────────────────
    const sortingSelect = document.getElementById("sortingOptions");
    if (sortingSelect) {
        sortingSelect.addEventListener("change", function () {
            sortAds(sortingSelect.value);
        });
    }
    function sortAds(sortType) {
        const adsContainer = document.querySelector(".all-ads-container");
        if (!adsContainer)
            return;
        const ads = Array.from(adsContainer.querySelectorAll(".ad-card"));
        ads.sort((a, b) => {
            if (sortType === "date") {
                const dateA = new Date(a.querySelector(".ad-date")?.textContent || 0);
                const dateB = new Date(b.querySelector(".ad-date")?.textContent || 0);
                return dateB.getTime() - dateA.getTime();
            }
            else if (sortType === "price-high") {
                const priceA = parseInt((a.querySelector(".ad-price")?.textContent || "0").replace(/\s/g, ""));
                const priceB = parseInt((b.querySelector(".ad-price")?.textContent || "0").replace(/\s/g, ""));
                return priceB - priceA;
            }
            else if (sortType === "price-low") {
                const priceA = parseInt((a.querySelector(".ad-price")?.textContent || "0").replace(/\s/g, ""));
                const priceB = parseInt((b.querySelector(".ad-price")?.textContent || "0").replace(/\s/g, ""));
                return priceA - priceB;
            }
            return 0;
        });
        adsContainer.innerHTML = "";
        ads.forEach((ad) => adsContainer.appendChild(ad));
    }
    // ─── FAVORITES ────────────────────────────────────────────────────────────
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem("mobilaz_favorites") || "[]");
        }
        catch {
            return [];
        }
    }
    function saveFavorites(favs) {
        localStorage.setItem("mobilaz_favorites", JSON.stringify(favs));
    }
    function getAdId(card) {
        // Use title + price as a stable ID
        const title = card.querySelector(".ad-title")?.textContent.trim() || "";
        const price = card.querySelector(".ad-price")?.textContent.trim() || "";
        return `${title}__${price}`;
    }
    function initFavoriteButtons() {
        const favs = getFavorites();
        document.querySelectorAll(".favorite-btn").forEach((btn) => {
            const card = btn.closest(".ad-card");
            if (!card)
                return;
            const id = getAdId(card);
            // Restore saved state
            if (favs.includes(id)) {
                btn.classList.add("favorited");
                const icon = btn.querySelector("i");
                if (icon) {
                    icon.classList.remove("far");
                    icon.classList.add("fas");
                }
            }
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                const currentFavs = getFavorites();
                const adId = getAdId(card);
                const icon = this.querySelector("i");
                if (currentFavs.includes(adId)) {
                    // Remove from favorites
                    const updated = currentFavs.filter((f) => f !== adId);
                    saveFavorites(updated);
                    this.classList.remove("favorited");
                    if (icon) {
                        icon.classList.remove("fas");
                        icon.classList.add("far");
                    }
                }
                else {
                    // Add to favorites
                    currentFavs.push(adId);
                    saveFavorites(currentFavs);
                    this.classList.add("favorited");
                    if (icon) {
                        icon.classList.remove("far");
                        icon.classList.add("fas");
                    }
                }
            });
        });
    }
    initFavoriteButtons();
    // ─── CATALOG DROPDOWN CLOSE ON OUTSIDE CLICK ─────────────────────────────
    document.addEventListener("click", function (e) {
        const catalogDropdown = document.querySelector(".catalog-dropdown");
        const target = e.target;
        if (catalogDropdown && target && !target.closest(".catalog-dropdown")) {
            const menu = catalogDropdown.querySelector(".catalog-menu");
            if (menu)
                menu.style.display = "";
        }
    });
    // ─── DARK MODE / LIGHT MODE THEME INITIALIZER ────────────────────────────
    function initTheme() {
        const savedTheme = localStorage.getItem("mobilaz_theme");
        if (savedTheme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        }
        // Theme toggle button logic
        const themeToggleBtn = document.getElementById("themeToggle");
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener("click", function () {
                const currentTheme = document.documentElement.getAttribute("data-theme");
                let newTheme = "light";
                if (currentTheme !== "dark") {
                    newTheme = "dark";
                    document.documentElement.setAttribute("data-theme", "dark");
                }
                else {
                    document.documentElement.removeAttribute("data-theme");
                }
                localStorage.setItem("mobilaz_theme", newTheme);
            });
        }
    }
    initTheme();

    // ─── RANDOMIZE SELLER PROFILE FOR AD DETAIL PAGES ────────────────────────────
    function randomizeSellerProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        let adId = parseInt(urlParams.get('id'));
        if (!adId || isNaN(adId)) adId = 1;

        const fakeRandom = function(seed) {
            let x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const privateNames = [
            "Elçin Məmmədov", "Əli Qasımov", "Tural Əliyev", "Vüqar Rəhimov", "Samir Həsənov",
            "Nigar Quliyeva", "Aytən Rəhimova", "Kənan Səfərov", "Rəşad Nəbiyev", "Elnur Qarayev",
            "Fəridə Abbasova", "Orxan Mürsəlov", "Nurlan Hacıyev", "Rəşid Quliyev"
        ];
        
        const storesData = [
            { name: "LeadTech Mobile", logo: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200", badge: "Pro", loc: "Bakı, 28 May m/s", time: "09:00 – 21:00", rating: "4.9", active: "127", sales: "2.4K", follows: "3.1K", desc: "LeadTech Mobile rəsmi mağazamızdan satılır. Bütün məhsullar orijinaldır." },
            { name: "Kontakt Home", logo: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=200", badge: "Premium", loc: "Bakı, Gənclik Mall", time: "10:00 – 22:00", rating: "4.8", active: "542", sales: "15K", follows: "52K", desc: "Kontakt Home - Sevindirən şəbəkə. Rəsmi zəmanət və hissə-hissə ödəniş." },
            { name: "İrşad", logo: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=200", badge: "Pro", loc: "Bakı, Nərimanov", time: "09:00 – 21:00", rating: "4.7", active: "310", sales: "8K", follows: "25K", desc: "İrşad - Yaşa, Yarat, Paylaş! Ən son texnologiya artıq sizə daha yaxındır." },
            { name: "Baku Electronics", logo: "https://images.unsplash.com/photo-1550005973-587922d326f2?q=80&w=200", badge: "Premium", loc: "Bakı, 20 Yanvar", time: "10:00 – 21:00", rating: "4.8", active: "480", sales: "12K", follows: "40K", desc: "Baku Electronics - hər zaman yenilikçi! Zəmanətli məhsullar ünvanı." },
            { name: "Maxi.az", logo: "https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?q=80&w=200", badge: "Pro", loc: "Bakı, Dəniz Mall", time: "10:00 – 22:00", rating: "4.9", active: "215", sales: "5K", follows: "12K", desc: "Maxi.az ilə fərqi hiss et! Təhlükəsiz alış-veriş və rəsmi zəmanət." },
            { name: "Music Gallery", logo: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=200", badge: "Standart", loc: "Bakı, Xətai", time: "10:00 – 20:00", rating: "4.6", active: "95", sales: "1.2K", follows: "4K", desc: "Music Gallery - Premium elektronika. Yüksək xidmət səviyyəsi." },
            { name: "Smart Store", logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200", badge: "Standart", loc: "Sumqayıt, Mərkəz", time: "09:00 – 20:00", rating: "4.5", active: "60", sales: "800", follows: "2.1K", desc: "Smart Store. İkinci əl və yeni cihazlar, barter xidməti aktivdir." },
            { name: "Alma Store", logo: "https://images.unsplash.com/photo-1611406560410-09b9eb210c4f?q=80&w=200", badge: "Premium", loc: "Bakı, Port Baku", time: "10:00 – 22:00", rating: "5.0", active: "45", sales: "3K", follows: "18K", desc: "Alma Store - Apple Premium Reseller. Rəsmi zəmanət və orijinal mallar." },
            { name: "World Telecom", logo: "https://images.unsplash.com/photo-1550009158-9ebf6d250400?q=80&w=200", badge: "Pro", loc: "Gəncə, Mall", time: "09:00 – 21:00", rating: "4.7", active: "150", sales: "4K", follows: "8K", desc: "World Telecom! Yeni modellər ən sərfəli qiymətə bizdədir." },
            { name: "NoteComp", logo: "https://images.unsplash.com/photo-1550005973-587922d326f2?q=80&w=200", badge: "Standart", loc: "Bakı, Elmlər", time: "10:00 – 20:00", rating: "4.6", active: "35", sales: "1.2K", follows: "3K", desc: "NoteComp noutbuk və telefonların satışı və təmiri." },
            { name: "Galaxy Shop", logo: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200", badge: "Pro", loc: "Bakı, Neftçilər", time: "09:30 – 21:30", rating: "4.8", active: "250", sales: "6K", follows: "14K", desc: "Galaxy Shop: Bütün Android cihazlarının rəsmi mərkəzi." }
        ];

        const personalNameEl = document.querySelector('.personal-name');
        if (personalNameEl) {
            let nameIndex = Math.floor(fakeRandom(adId * 10) * privateNames.length);
            let name = privateNames[nameIndex];
            personalNameEl.textContent = name;
            
            let avatarEl = document.querySelector('.personal-avatar');
            if (avatarEl) {
                avatarEl.textContent = name.charAt(0);
                let hue = Math.floor(fakeRandom(adId * 20) * 360);
                avatarEl.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue+40)%360}, 70%, 50%))`;
            }

            let statEls = document.querySelectorAll('.personal-stats .val');
            if (statEls.length >= 3) {
                statEls[0].textContent = Math.floor(fakeRandom(adId * 30) * 50) + 1; // Ads shared
                statEls[1].textContent = (4.0 + fakeRandom(adId * 40)).toFixed(1); // Rating
                statEls[2].textContent = Math.floor(90 + fakeRandom(adId * 50) * 10) + '%'; // Positive
            }
        }

        const storeCardEl = document.querySelector('.store-seller-card');
        if (storeCardEl) {
            let storeIdx = Math.floor(fakeRandom(adId * 15) * storesData.length);
            let store = storesData[storeIdx];
            
            // Update Logo
            let logoEl = document.querySelector('.store-logo-circle');
            if (logoEl) { logoEl.src = store.logo; logoEl.alt = store.name + " Logo"; }

            // Update Name and Badge
            let nameEl = document.querySelector('.store-card-name');
            if (nameEl) {
                let badgeHtml = '';
                if (store.badge === 'Premium' || store.badge === 'Elite') {
                    badgeHtml = ' <i class="fas fa-crown" style="color:#ffd700;" title="Premium Mağaza"></i> <span class="store-badge-inline" style="background:linear-gradient(135deg,#c8a600,#ffd700);color:#333;"><i class="fas fa-crown"></i> ' + store.badge + '</span>';
                } else if (store.badge === 'Pro') {
                    badgeHtml = ' <i class="fas fa-check-circle s-verified" title="Rəsmi Mağaza"></i> <span class="store-badge-inline"><i class="fas fa-star"></i> Pro</span>';
                } else {
                    badgeHtml = ' <span class="store-badge-inline" style="background:#555;"><i class="fas fa-store"></i> Mağaza</span>';
                }
                nameEl.innerHTML = store.name + badgeHtml;
            }

            // Update Sub info (location & time)
            let subs = document.querySelectorAll('.store-card-sub');
            if (subs.length >= 2) {
                subs[0].innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + store.loc;
                subs[1].innerHTML = '<i class="fas fa-clock"></i> ' + store.time;
            }

            // Update Stats
            let statVals = document.querySelectorAll('.store-stats-grid .val');
            if (statVals.length >= 4) {
                statVals[0].textContent = store.rating;
                statVals[1].textContent = Math.floor(fakeRandom(adId * 2) * parseInt(store.active)) + 15;
                statVals[2].textContent = store.sales;
                statVals[3].textContent = store.follows;
            }

            // Update product description prefix
            let descEl = document.querySelector('.desc-text');
            if (descEl && !descEl.dataset.updated) {
                let existingText = descEl.innerHTML;
                descEl.innerHTML = '<strong>' + store.name + '</strong> — ' + store.desc + '<br><br>' + existingText.replace(/Samsung Galaxy.*?satılır\./, '');
                descEl.dataset.updated = 'true';
            }

            // Update View Store Link (so magaza profil has the ID)
            let viewStoreLink = document.querySelector('.view-store-link');
            if (viewStoreLink) {
                viewStoreLink.href = 'magaza-profil.html?id=' + adId;
            }
        }

        // Apply to Store Profile Page
        const magazaProfilEl = document.querySelector('.store-profile-bar');
        if (magazaProfilEl) {
            let storeIdx = Math.floor(fakeRandom(adId * 15) * storesData.length);
            let store = storesData[storeIdx];

            let logoLg = document.querySelector('.store-logo-large');
            if (logoLg) { logoLg.src = store.logo; logoLg.alt = store.name + " Logo"; }

            let nameEl = document.querySelector('.store-identity-name');
            if (nameEl) {
                let badgeHtml = '';
                if (store.badge === 'Premium' || store.badge === 'Elite') {
                    badgeHtml = ' <i class="fas fa-crown badge-verified" style="color:#ffd700;" title="Premium Mağaza"></i> <span class="store-pkg-badge premium"><i class="fas fa-crown"></i> ' + store.badge + ' Mağaza</span>';
                } else if (store.badge === 'Pro') {
                    badgeHtml = ' <i class="fas fa-check-circle badge-verified" title="Rəsmi Mağaza"></i> <span class="store-pkg-badge pro"><i class="fas fa-star"></i> Pro Mağaza</span>';
                } else {
                    badgeHtml = ' <span class="store-pkg-badge" style="background:#555;color:#fff;"><i class="fas fa-store"></i> Mağaza</span>';
                }
                nameEl.innerHTML = store.name + badgeHtml;
            }

            let subs = document.querySelectorAll('.store-sub-line span');
            if (subs.length >= 2) {
                subs[0].innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + store.loc;
                subs[1].innerHTML = '<i class="fas fa-clock"></i> ' + store.time;
            }

            let statVals = document.querySelectorAll('.store-stats-strip .val');
            if (statVals.length >= 5) {
                statVals[0].textContent = store.rating;
                statVals[1].textContent = store.active;
                statVals[2].textContent = store.sales;
                statVals[4].textContent = store.follows;
            }

            let aboutText = document.querySelector('.about-card p');
            if (aboutText && !aboutText.dataset.updated) {
                let existing = aboutText.innerHTML;
                aboutText.innerHTML = '<strong>' + store.name + '</strong> — ' + store.desc + '<br><br>' + existing.replace(/LeadTech Mobile.*?təklif edirik\./, '');
                aboutText.dataset.updated = 'true';
            }

            document.title = store.name + " — Mağaza Profili | Mobil.az";
        }
    }
    randomizeSellerProfile();
});

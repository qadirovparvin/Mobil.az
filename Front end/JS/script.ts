document.addEventListener("DOMContentLoaded", function () {

  // ─── TRANSLATIONS ────────────────────────────────────────────────────────
  type TranslationDict = { [key: string]: string };
  type TranslationsTree = { [lang: string]: TranslationDict };

  const translations: TranslationsTree = {
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
      "cab-news-camp-desc": "Mobil.az-dan yeniliklər, endirimlər və xüsusi təkliflər barədə xəbərlər",
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
      "privacy-page-sub": "Mobil.az istifadəçilərimizin məxfiliyini qorumağı prinsip kimi qəbul edir.",
      "privacy-updated": "Son yenilənmə: Mart 2025",
      "privacy-h2-collect": "Hansı Məlumatları Toplayırıq?",
      "privacy-h2-use": "Məlumatları Necə İstifadə Edirik?",
      "privacy-h2-share": "Məlumatları Paylaşırıqmı?",
      "privacy-h2-cookies": "Çərəzlər (Cookies)",
      "privacy-h2-rights": "İstifadəçi Hüquqları",
      "privacy-h2-security": "Məlumat Təhlükəsizliyi",
      "privacy-h2-changes": "Siyasətdə Dəyişikliklər",
      "privacy-h2-contact": "Bizimlə Əlaqə"
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
      "cab-news-camp-desc": "Updates, discounts, and special offers from Mobil.az",
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
      "privacy-page-sub": "Mobil.az considers protecting the privacy of our users as a principle.",
      "privacy-updated": "Last updated: March 2025",
      "privacy-h2-collect": "What Data Do We Collect?",
      "privacy-h2-use": "How Do We Use the Data?",
      "privacy-h2-share": "Do We Share Data?",
      "privacy-h2-cookies": "Cookies",
      "privacy-h2-rights": "User Rights",
      "privacy-h2-security": "Data Security",
      "privacy-h2-changes": "Changes to Policy",
      "privacy-h2-contact": "Contact Us"
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
      "cab-news-camp-desc": "Новости, скидки и специальные предложения от Mobil.az",
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
      "privacy-page-sub": "Mobil.az считает защиту конфиденциальности пользователей принципом.",
      "privacy-updated": "Последнее обновление: Март 2025",
      "privacy-h2-collect": "Какие данные мы собираем?",
      "privacy-h2-use": "Как мы используем данные?",
      "privacy-h2-share": "Передаём ли мы данные?",
      "privacy-h2-cookies": "Файлы Cookie",
      "privacy-h2-rights": "Права пользователя",
      "privacy-h2-security": "Безопасность данных",
      "privacy-h2-changes": "Изменения в политике",
      "privacy-h2-contact": "Свяжитесь с нами"
    }
  };

  const authTranslations: TranslationsTree = {
    AZ: {
      "login-btn": "Giri\u015f",
      "register-btn": "Qeydiyyat",
      "auth-login-page-title": "Giri\u015f - Mobil.az",
      "auth-signup-page-title": "Qeydiyyat - Mobil.az",
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
      "auth-login-page-title": "Log In - Mobil.az",
      "auth-signup-page-title": "Sign Up - Mobil.az",
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
      "auth-login-page-title": "\u0412\u0445\u043e\u0434 - Mobil.az",
      "auth-signup-page-title": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f - Mobil.az",
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

  for (const lang of Object.keys(authTranslations) as Array<keyof typeof authTranslations>) {
    Object.assign(translations[lang], authTranslations[lang]);
  }

  (window as Window & { translations: TranslationsTree }).translations = translations;

  // ─── LANGUAGE SWITCHER ────────────────────────────────────────────────────
  const langSwitcher = document.querySelector(".language-selector");
  const currentLangElement = document.getElementById("current-lang");

  function changeLanguage() {
    if (!currentLangElement) return;
    let currentLang = currentLangElement.innerText.trim();
    // Normalise RUS display label back to key
    if (currentLang === "РУС") currentLang = "RUS";
    let newLang = currentLang === "AZ" ? "ENG" : currentLang === "ENG" ? "RUS" : "AZ";

    currentLangElement.innerText = translations[newLang]["language-selector"];
    localStorage.setItem("lang", newLang);
    document.documentElement.lang = newLang === "ENG" ? "en" : newLang === "RUS" ? "ru" : "az";

    document.querySelectorAll("[data-translate]").forEach((element) => {
      let key = element.getAttribute("data-translate");
      if (!key || !translations[newLang][key]) return;

      if (element.tagName === "LI") {
        const link = element.querySelector("a");
        if (link) {
          const icon = link.querySelector("i");
          link.innerHTML = icon
            ? icon.outerHTML + " " + translations[newLang][key]
            : translations[newLang][key];
        }
      } else if (
        element.classList.contains("login-btn") ||
        element.classList.contains("register-btn")
      ) {
        const icon = element.querySelector("i");
        element.innerHTML = icon
          ? icon.outerHTML + " " + translations[newLang][key]
          : translations[newLang][key];
      } else {
        const text = translations[newLang][key];
        if (text.includes("<") && text.includes(">")) {
          element.innerHTML = text;
        } else {
          element.textContent = text;
        }
      }
    });

    const searchInput = document.querySelector(".search-options input") as HTMLInputElement | null;
    if (searchInput) {
      searchInput.placeholder = translations[newLang]["search-placeholder"];
    }

    // Logic for placeholder attributes and select list text
    document.querySelectorAll("[data-translate-placeholder]").forEach((el) => {
      let element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      let key = element.getAttribute("data-translate-placeholder");
      if (key && translations[newLang][key]) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
          if ("placeholder" in element) {
            element.placeholder = translations[newLang][key];
          }
          if (element.tagName === "SELECT") {
            const selectEl = element as HTMLSelectElement;
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
      let key = el.getAttribute("data-translate-title");
      if (key && translations[newLang][key]) {
        document.title = translations[newLang][key];
      }
    });

    document.dispatchEvent(new CustomEvent("mobilaz:languagechange", { detail: { lang: newLang } }));
  }

  // Restore saved language on page load
  const savedLang = localStorage.getItem("lang");
  if (savedLang && savedLang !== "AZ") {
    // Temporarily set currentLangElement to trigger correct transition
    if (currentLangElement) {
      if (savedLang === "ENG") {
        currentLangElement.innerText = "AZ";
        changeLanguage(); // AZ → ENG
      } else if (savedLang === "RUS") {
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
  const buttonGroups = document.querySelectorAll(
    ".memory-buttons, .fingerprint-buttons, .nfc-buttons, .waterproof-buttons, .expandable-buttons, .delivery-buttons, .condition-buttons, .color-buttons"
  );

  buttonGroups.forEach((group) => {
    const buttons = group.querySelectorAll("button");
    buttons.forEach((button) => {
      button.addEventListener("click", function () {
        buttons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
      });
    });
  });

  // ─── SORTING ──────────────────────────────────────────────────────────────
  const sortingSelect = document.getElementById("sortingOptions") as HTMLSelectElement | null;
  if (sortingSelect) {
    sortingSelect.addEventListener("change", function () {
      sortAds(sortingSelect.value);
    });
  }

  function sortAds(sortType: string) {
    const adsContainer = document.querySelector(".all-ads-container");
    if (!adsContainer) return;

    const ads = Array.from(adsContainer.querySelectorAll(".ad-card"));

    ads.sort((a, b) => {
      if (sortType === "date") {
        const dateA = new Date(a.querySelector(".ad-date")?.textContent || 0);
        const dateB = new Date(b.querySelector(".ad-date")?.textContent || 0);
        return dateB.getTime() - dateA.getTime();
      } else if (sortType === "price-high") {
        const priceA = parseInt((a.querySelector(".ad-price")?.textContent || "0").replace(/\s/g, ""));
        const priceB = parseInt((b.querySelector(".ad-price")?.textContent || "0").replace(/\s/g, ""));
        return priceB - priceA;
      } else if (sortType === "price-low") {
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
  function getFavorites(): string[] {
    try {
      return JSON.parse(localStorage.getItem("mobilaz_favorites") || "[]");
    } catch {
      return [];
    }
  }

  function saveFavorites(favs: string[]) {
    localStorage.setItem("mobilaz_favorites", JSON.stringify(favs));
  }

  function getAdId(card: Element): string {
    // Use title + price as a stable ID
    const title = card.querySelector(".ad-title")?.textContent.trim() || "";
    const price = card.querySelector(".ad-price")?.textContent.trim() || "";
    return `${title}__${price}`;
  }

  function initFavoriteButtons() {
    const favs = getFavorites();
    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      const card = btn.closest(".ad-card");
      if (!card) return;
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

      btn.addEventListener("click", function (this: HTMLElement, e: Event) {
        e.stopPropagation();
        const currentFavs = getFavorites();
        const adId = getAdId(card);
        const icon = this.querySelector("i");

        if (currentFavs.includes(adId)) {
          // Remove from favorites
          const updated = currentFavs.filter((f) => f !== adId);
          saveFavorites(updated);
          this.classList.remove("favorited");
          if (icon) { icon.classList.remove("fas"); icon.classList.add("far"); }
        } else {
          // Add to favorites
          currentFavs.push(adId);
          saveFavorites(currentFavs);
          this.classList.add("favorited");
          if (icon) { icon.classList.remove("far"); icon.classList.add("fas"); }
        }
      });
    });
  }

  initFavoriteButtons();

  // ─── CATALOG DROPDOWN CLOSE ON OUTSIDE CLICK ─────────────────────────────
  document.addEventListener("click", function (e: Event) {
    const catalogDropdown = document.querySelector(".catalog-dropdown");
    const target = e.target as HTMLElement | null;
    if (catalogDropdown && target && !target.closest(".catalog-dropdown")) {
      const menu = catalogDropdown.querySelector(".catalog-menu") as HTMLElement | null;
      if (menu) menu.style.display = "";
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
        } else {
          document.documentElement.removeAttribute("data-theme");
        }

        localStorage.setItem("mobilaz_theme", newTheme);
      });
    }
  }

  initTheme();

});

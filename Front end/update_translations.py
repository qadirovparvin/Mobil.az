import re
import os

translations = {
    'AZ': {
        'about-h1': 'Mobil.az — Azərbaycanda Mobil Cihazların Yeni və Etibarlı Ticarət Platforması',
        'about-sub': 'Rəqəmsal dünyanın ehtiyaclarına uyğunlaşdırılmış ixtisaslaşmış bazar yeri',
        'about-p1': 'Azərbaycanın elektron ticarət sektorunda <b style="color: blueviolet;">Mobil.az</b> sırf mobil cihazlar və aksesuarları üzrə ixtisaslaşmış ilk innovativ platformalardan biridir. Ənənəvi elan saytlarından fərqli olaraq, biz yalnız telekommunikasiya məhsullarına köklənməklə həm alıcılar, həm də satıcılar üçün daha sürətli, təhlükəsiz və məqsədyönlü ticarət mühiti yaradırıq.',
        'about-p2': 'Platformamız vasitəsilə həm fiziki şəxslər, həm də korporativ mağazalar yeni və ya ikinci əl mobil cihazların alqı-satqısını rahatlıqla həyata keçirə bilərlər.',
        'about-p3': 'Hər büdcəyə uyğun geniş çeşiddə məhsulları bir araya gətirən Mobil.az, təklif edilən cihazların ətraflı texniki göstəricilərini, qiymət analizi və vəziyyətini şəffaf şəkildə istifadəçilərə təqdim edir. Bizim əsas məqsədimiz bazardakı ən optimal seçimləri bir platformada cəmləşdirərək istifadəçi təcrübəsini maksimum dərəcədə sadələşdirməkdir.',
        'about-h2-1': 'Platformamızda Hansı Məhsullar Təqdim Olunur?',
        'about-ul1-1': 'Qlobal brendlərin ən son smartfon modelləri və geniş çeşiddə mobil telefonlar',
        'about-ul1-2': 'Apple, Samsung, Xiaomi və digər aparıcı istehsalçıların hər ehtiyaca uyğun planşet modelləri',
        'about-ul1-3': 'Yüksək səs keyfiyyətinə malik simli və simsiz qulaqlıqlar, eləcə də digər audio sistemlər',
        'about-ul1-4': 'Orijinal qidalandırıcı bloklar (adapterlər), qoruyucu örtüklər, ekran qoruyucuları və digər zəruri aksesuarlar',
        'about-h2-2': 'Niyə Mobil.az Platformasını Seçməlisiniz?',
        'about-ul2-1': 'İxtisaslaşmış Bazar: Yalnız rəqəmsal cihazlar və onların aksesuarlarına xidmət göstərən tək profilli ekosistem.',
        'about-ul2-2': 'İnnovativ Axtarış: Qabaqcıl filtrasiya sistemləri sayəsində axtarılan hər hansı detalı saniyələr içində tapmaq imkanı.',
        'about-ul2-3': 'Etibarlı Ticarət Mühiti: Satıcılar üçün tam şəffaf reytinq və real müştəri rəylərinə əsaslanan qiymətləndirmə sistemi.',
        'about-ul2-4': 'Elastik Təşviqat Paketləri: Hər bir istifadəçinin və mağazanın hədəflərinə uyğunlaşdırılmış Standart, PRO və VIP elan paketləri.',
        'about-h2-3': 'Mobil.az-ın İş Mexanizmi',
        'about-p4': 'Sistemimiz istər fərdi satıcıların, istərsə də rəsmi mağazaların məhsullarını birbaşa hədəf kütləsinə çatdırması üçün optimallaşdırılmışdır.',
        'about-h3-1': '1. Fərdi Satıcılar Üçün',
        'about-ul3-1': 'Sürətli Satış: Hər bir şəxs saniyələr içində ödənişsiz və ya ödənişli əsaslarla öz cihazının elanını minlərlə potensial alıcıya təqdim edə bilər.',
        'about-ul3-2': 'Birbaşa Kommunikasiya: Daxili mesajlaşma sistemi və ya birbaşa nömrə vasitəsilə alıcı-satıcı mühitində sürətli əlaqə.',
        'about-ul3-3': 'Hədəfli Təqdimat: İstifadəçilər büdcə və xüsusiyyətlər üzrə detallı axtarışlar apararaq ən düzgün elanlara yönəldilirlər.',
        'about-h3-2': '2. Korporativ Mağazalar Üçün',
        'about-ul4-1': 'Virtual Filiallar: Şirkətlər asanlıqla özlərinin rəsmi virtual mağazalarını yaradaraq bizneslərini rəqəmsallaşdıra bilərlər.',
        'about-ul4-2': 'B2B Həllər və Təşviqat: Mağazalar üçün xüsusi olaraq dizayn edilmiş idarəetmə paneli və premium reklam xidmətləri.',
        'about-ul4-3': 'Korporativ Vitrin: Müəssisələr bütün ehtiyatlarını məhz bu seqmentlə maraqlanan ixtisaslaşmış, geniş alıcı kütləsinə nümayiş etdirə bilirlər.',
        'about-h2-4': 'Davamlı İnkişaf və Gələcək Hədəflərimiz',
        'about-ul5-1': 'Tətbiq Ekosistemi: Həm iOS, həm də Android istifadəçiləri üçün istifadəçi məmnuniyyətini zirvəyə qaldıracaq Mobil.az tətbiqinin tezliklə istifadəyə verilməsi.',
        'about-ul5-2': 'Süni İntellekt (AI) İnteqrasiyası: Alqoritmlər vasitəsilə istifadəçilərə ən uyğun məhsulların tövsiyə edilməsi və ağıllı qiymət analizatoru.',
        'about-ul5-3': 'Avtomatlaşdırılmış Moderasiya: Həm maşın öyrənməsi, həm də canlı moderatorlar vasitəsilə saxta və etibarsız elanların anında aşkarlanaraq bloklanması.',
        'about-p5': 'Mobil.az olaraq məqsədimiz, Azərbaycan bazarında telekommunikasiya cihazlarının ticarətini beynəlxalq standartlara çatdırmaq və bu sahədə etibarlılıq simvolu olmaqdır.',
        'about-tagline': 'Mobil.az – Rəqəmsal Dünyanın Etibarlı Ticarət Mərkəzi.'
    },
    'ENG': {
        'about-h1': 'Mobil.az — The Innovative & Reliable Tech Marketplace in Azerbaijan',
        'about-sub': 'A specialized marketplace tailored for digital devices',
        'about-p1': '<b style="color: blueviolet;">Mobil.az</b> stands as one of the pioneering e-commerce platforms in Azerbaijan, specializing exclusively in mobile devices. Unlike traditional classified platforms, our narrow focus on telecommunications allows us to create a faster, safer, and more targeted trading environment for both buyers and sellers.',
        'about-p2': 'Through our platform, both individuals and corporate stores can securely and easily buy or sell new and pre-owned digital devices.',
        'about-p3': 'Bringing together a wide array of products suitable for every budget, Mobil.az transparently provides detailed technical specifications, price analyses, and product conditions. Our main objective is to maximize user experience by consolidating the optimal market choices into a single unified platform.',
        'about-h2-1': 'What Can You Discover on Our Platform?',
        'about-ul1-1': 'The latest smartphones and a wide array of mobile phones from global brands.',
        'about-ul1-2': 'Tablet models catering to every need from leading manufacturers like Apple, Samsung, and Xiaomi.',
        'about-ul1-3': 'High-fidelity wireless and wired headphones, along with advanced audio systems.',
        'about-ul1-4': 'Original power adapters, premium phone cases, screen protectors, and other essential accessories.',
        'about-h2-2': 'Why Should You Choose Mobil.az?',
        'about-ul2-1': 'Specialized Marketplace: A dedicated ecosystem focused entirely on digital devices and accessories.',
        'about-ul2-2': 'Innovative Search: Advanced filtering systems that help you find exactly what you need in seconds.',
        'about-ul2-3': 'Secure Trading Environment: A fully transparent rating system based on real customer feedback to ensure seller reliability.',
        'about-ul2-4': 'Flexible Promotion Packages: Standard, PRO, and VIP ad packages tailored to the specific goals of individual users and corporate stores.',
        'about-h2-3': 'The Operational Mechanism of Mobil.az',
        'about-p4': 'Our system is highly optimized to help both individual sellers and official stores connect their products directly with a targeted audience.',
        'about-h3-1': '1. For Individual Sellers',
        'about-ul3-1': 'Accelerated Sales: Anyone can publish free or premium ads in seconds, instantly reaching thousands of potential buyers.',
        'about-ul3-2': 'Direct Communication: Seamless interaction between buyers and sellers via an internal messaging system or direct calls.',
        'about-ul3-3': 'Targeted Presentation: Buyers are guided to the best ads through detailed filtering based on budget and technical specifications.',
        'about-h3-2': '2. For Corporate Stores',
        'about-ul4-1': 'Virtual Branches: Companies can effortlessly digitize their business by establishing an official virtual storefront on our platform.',
        'about-ul4-2': 'B2B Solutions & Promotion: Custom-designed management dashboards and premium advertising services tailored for retail businesses.',
        'about-ul4-3': 'Corporate Showcase: Businesses can display their entire inventory to a vast, specialized audience genuinely interested in tech products.',
        'about-h2-4': 'Continuous Development & Future Goals',
        'about-ul5-1': 'Application Ecosystem: The upcoming launch of the Mobil.az mobile app for iOS and Android, designed to elevate user satisfaction to new heights.',
        'about-ul5-2': 'Artificial Intelligence (AI) Integration: Implementing algorithms to recommend the most relevant products and introducing an intelligent price analyzer.',
        'about-ul5-3': 'Automated Moderation: Instant detection and blocking of fraudulent and unreliable ads through advanced machine learning and live moderators.',
        'about-p5': 'At Mobil.az, our mission is to elevate the trade of telecommunication devices in the Azerbaijani market to international standards and become the ultimate symbol of reliability in this sector.',
        'about-tagline': 'Mobil.az – The Trusted Trading Center of the Digital World.'
    },
    'RUS': {
        'about-h1': 'Mobil.az — Инновационная и надежная торговая платформа для мобильных устройств в Азербайджане',
        'about-sub': 'Специализированный маркетплейс, созданный для цифровых устройств',
        'about-p1': 'Платформа <b style="color: blueviolet;">Mobil.az</b> является одним из первых проектов в секторе электронной коммерции Азербайджана, специализирующимся исключительно на мобильных устройствах. В отличие от традиционных сайтов объявлений, наша узкая направленность на телекоммуникации позволяет нам создавать более быструю, безопасную и целевую торговую среду как для покупателей, так и для продавцев.',
        'about-p2': 'Наша платформа предоставляет возможность как частным лицам, так и корпоративным магазинам комфортно и безопасно осуществлять куплю-продажу новых или подержанных устройств.',
        'about-p3': 'Объединяя широкий ассортимент товаров для любого бюджета, Mobil.az прозрачно предоставляет подробные технические характеристики, анализ цен и состояние предлагаемых устройств. Наша главная цель — максимально упростить работу пользователей за счет консолидации оптимального выбора на рынке в рамках одной удобной платформы.',
        'about-h2-1': 'Какие товары представлены на нашей платформе?',
        'about-ul1-1': 'Новейшие смартфоны и широкий выбор мобильных телефонов от мировых брендов.',
        'about-ul1-2': 'Планшеты для любых нужд от таких ведущих производителей, как Apple, Samsung и Xiaomi.',
        'about-ul1-3': 'Проводные и беспроводные наушники с высоким качеством звука, а также другие аудиосистемы.',
        'about-ul1-4': 'Оригинальные адаптеры питания, защитные чехлы, защитные стекла и другие необходимые аксессуары.',
        'about-h2-2': 'Почему стоит выбрать платформу Mobil.az?',
        'about-ul2-1': 'Специализированный рынок: Единая экосистема, полностью посвященная цифровым устройствам и их аксессуарам.',
        'about-ul2-2': 'Инновационный поиск: Передовые системы фильтрации позволяют найти любую желаемую деталь за считанные секунды.',
        'about-ul2-3': 'Надежная торговая среда: Полностью прозрачная система рейтингов и отзывов реальных клиентов для оценки надежности продавцов.',
        'about-ul2-4': 'Гибкие пакеты продвижения: Пакеты объявлений Стандарт, PRO и VIP, адаптированные к целям каждого пользователя и магазина.',
        'about-h2-3': 'Механизм работы Mobil.az',
        'about-p4': 'Наша система оптимизирована для того, чтобы помочь как частным продавцам, так и официальным магазинам доставить свою продукцию напрямую целевой аудитории.',
        'about-h3-1': '1. Для частных продавцов',
        'about-ul3-1': 'Быстрые продажи: Любой человек может за считанные секунды разместить объявление о своем устройстве и представить его тысячам потенциальных покупателей.',
        'about-ul3-2': 'Прямая коммуникация: Быстрая связь в среде покупатель-продавец через внутреннюю систему обмена сообщениями или прямой номер.',
        'about-ul3-3': 'Целевая презентация: Пользователи направляются к наиболее подходящим объявлениям с помощью детального поиска по бюджету и характеристикам.',
        'about-h3-2': '2. Для корпоративных магазинов',
        'about-ul4-1': 'Виртуальные филиалы: Компании могут легко оцифровать свой бизнес, создав официальный виртуальный магазин на платформе.',
        'about-ul4-2': 'B2B решения и продвижение: Специально разработанная панель управления магазином и рекламные услуги премиум-класса.',
        'about-ul4-3': 'Корпоративная витрина: Компании могут демонстрировать весь свой инвентарь специализированной аудитории, заинтересованной именно в этом сегменте.',
        'about-h2-4': 'Непрерывное развитие и будущие цели',
        'about-ul5-1': 'Экосистема приложения: Скорый запуск мобильного приложения Mobil.az для пользователей iOS и Android, которое поднимет удобство использования на новый уровень.',
        'about-ul5-2': 'Интеграция искусственного интеллекта (ИИ): Алгоритмы для рекомендаций наиболее подходящих продуктов и интеллектуальный анализатор цен.',
        'about-ul5-3': 'Автоматизированная модерация: Мгновенное обнаружение и блокировка мошеннических и недостоверных объявлений с помощью машинного обучения и модераторов.',
        'about-p5': 'Как Mobil.az, наша цель — поднять торговлю телекоммуникационными устройствами на рынке Азербайджана до международных стандартов и стать символом надежности в этом секторе.',
        'about-tagline': 'Mobil.az – Надежный торговый центр цифрового мира.'
    }
}

base_dir = r"c:\Users\Gadirov\Desktop\AiryPhone - COPY\Front end"

# 1. Update JS/script.ts
script_path = os.path.join(base_dir, "JS", "script.ts")
with open(script_path, "r", encoding="utf-8") as f:
    script_content = f.read()

for lang, kvs in translations.items():
    for k, v in kvs.items():
        v_escaped = v.replace("\\", "\\\\").replace("\"", "\\\"")
        # Match "key": "value"
        pattern = re.compile(r'((?:\"|\')?' + re.escape(k) + r'(?:\"|\')?\s*:\s*)(?:\"|`)(.*?)(?:\"|`)(,|})', flags=re.DOTALL)
        script_content = pattern.sub(r'\g<1>"' + v_escaped + r'"\g<3>', script_content)

with open(script_path, "w", encoding="utf-8") as f:
    f.write(script_content)

# 2. Update about.html
about_path = os.path.join(base_dir, "about.html")
with open(about_path, "r", encoding="utf-8") as f:
    about_content = f.read()

for k, v in translations['AZ'].items():
    # We want to replace everything inside the tag that has data-translate="k"
    # Example format: <p data-translate="about-p1">Old content</p>
    # Using regex with DOTALL to match newlines inside the content
    # Note: We match <TAG ... data-translate="k" ...>CONTENT</TAG>
    
    # This regex is robust for the specific structure of this file
    pattern = re.compile(r'(data-translate="' + re.escape(k) + r'"[^>]*>)(.*?)(</(?:h1|h2|h3|p|span|strong|b|div)>)', flags=re.DOTALL)
    about_content = pattern.sub(r'\g<1>' + v + r'\g<3>', about_content)

with open(about_path, "w", encoding="utf-8") as f:
    f.write(about_content)

print("Updated script.ts and about.html successfully.")

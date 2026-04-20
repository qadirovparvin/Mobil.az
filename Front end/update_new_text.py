import re
import os

base_dir = r"c:\Users\Gadirov\Desktop\AiryPhone - COPY\Front end"
script_path = os.path.join(base_dir, "JS", "script.ts")

with open(script_path, "r", encoding="utf-8") as f:
    content = f.read()

translations = {
    'AZ': {
        'about-ul1-1': 'Yeni və işlənmiş smartfonlar, bütün marka və qiymət aralıqları',
        'about-ul1-2': 'Apple, Samsung, Xiaomi və digər istehsalçılardan planşet modelləri',
        'about-ul1-3': 'Simli və simsiz qulaqlıqlar, audio aksesuarlar',
        'about-ul1-4': 'Adapterlər, qoruyucu örtüklər, ekran qoruyucuları və daha çoxu',
        'about-category-summary': 'Həm alıcılar, həm də satıcılar Mobil.az-da işlərini asanlıqla həll edirlər. Elanınızı pulsuz yerləşdirin, alıcı tapın.'
    },
    'ENG': {
        'about-ul1-1': 'New and used smartphones, all brands and price ranges',
        'about-ul1-2': 'Tablet models from Apple, Samsung, Xiaomi and other manufacturers',
        'about-ul1-3': 'Wired and wireless headphones, audio accessories',
        'about-ul1-4': 'Adapters, protective covers, screen protectors and more',
        'about-category-summary': 'Both buyers and sellers do their job easily on Mobil.az. Place your ad for free, find a buyer.'
    },
    'RUS': {
        'about-ul1-1': 'Новые и б/у смартфоны, все бренды и ценовые категории',
        'about-ul1-2': 'Модели планшетов от Apple, Samsung, Xiaomi и других производителей',
        'about-ul1-3': 'Проводные и беспроводные наушники, аудиоаксессуары',
        'about-ul1-4': 'Адаптеры, защитные чехлы, защитные стекла и многое другое',
        'about-category-summary': 'И покупатели, и продавцы легко решают свои задачи на Mobil.az. Разместите объявление бесплатно, найдите покупателя.'
    }
}

# The translations object in script.ts is structured as a nested dictionary under language keys.
# We will use string manipulation to safely replace the values within the specific language blocks.

import ast
# We won't use AST since it's TS and Python's AST doesn't parse JS/TS.

for lang, kvs in translations.items():
    # Find the block for the language
    # Example: "AZ": { ... }
    # We find "AZ": { and the ending }, but we must be careful with nested brackets.
    # Instead, let's just use regex to replace the specific keys but restricting to the language block
    # Actually, the keys in `script.ts` are unique across the whole file except that they appear once per language block.
    # Wait, about-ul1-1 appears exactly three times: one for AZ, one for ENG, one for RUS in that order.
    pass

# Safe way to replace:
# We know the specific texts currently in script.ts! We can just do string replace for each.

old_texts = {
    'AZ': {
        'about-ul1-1': '"Dünyaca məşhur brendlərin smartfon və mobil telefon modelləri"',
        'about-ul1-2': '"Apple iPad-dən tutmuş, Xiaomi Redmi Pad və Samsung Galaxy Tab-a qədər – hər zövqə uyğun planşet buradadır!"',
        'about-ul1-3': '"Simsiz və simli qulaqcıqlar, və digər səs sistemləri"',
        'about-ul1-4': '"Adapterlər, kabrolar, ekran qoruyucıarı və daha nələr?!"',
    },
    'ENG': {
        'about-ul1-1': '"Smartphones and mobile phone models of world-famous brands"',
        'about-ul1-2': '"From Apple iPad to Xiaomi Redmi Pad and Samsung Galaxy Tab – a tablet for every taste is here!"',
        'about-ul1-3': '"Wireless and wired headphones, and other sound systems"',
        'about-ul1-4': '"Adapters, cases, screen protectors and what else?!"',
    },
    'RUS': {
        'about-ul1-1': '"Смартфоны и модели мобильных телефонов всемирно известных брендов"',
        'about-ul1-2': '"От Apple iPad до Xiaomi Redmi Pad и Samsung Galaxy Tab — планшеты на любой вкус здесь!"',
        'about-ul1-3': '"Беспроводные и проводные наушники, и другие звуковые системы"',
        'about-ul1-4': '"Адаптеры, чехлы, защитные экраны и многое другое!"',
    }
}

for lang in ['AZ', 'ENG', 'RUS']:
    for k in ['about-ul1-1', 'about-ul1-2', 'about-ul1-3', 'about-ul1-4']:
        old_val = old_texts[lang][k]
        new_val = '"' + translations[lang][k] + '"'
        
        # Replace only if the old string exists to prevent accidental multiple replacements 
        if old_val in content:
            content = content.replace(f'"{k}": {old_val}', f'"{k}": {new_val}')

# Now for the new key "about-category-summary". We append it right after "about-ul1-4".
# We can search for the line containing "about-ul1-4": "..." and append the new line.
for lang in ['AZ', 'ENG', 'RUS']:
    new_val = translations[lang]['about-ul1-4']
    new_summary = translations[lang]['about-category-summary']
    
    # The line in file will look like:
    #       "about-ul1-4": "Adapters, protective covers, screen protectors and more",
    
    pattern = re.compile(r'(\s*\"about-ul1-4\":\s*\"' + re.escape(new_val) + r'\",?)')
    # Use sub to add the new key right after
    replacement = r'\g<1>\n      "about-category-summary": "' + new_summary + '",'
    content = pattern.sub(replacement, content)

with open(script_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated script.ts correctly!")

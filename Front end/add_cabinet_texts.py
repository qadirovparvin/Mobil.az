import re
import os

base_dir = r"c:\Users\Gadirov\Desktop\AiryPhone - COPY\Front end"
script_path = os.path.join(base_dir, "JS", "script.ts")

with open(script_path, "r", encoding="utf-8") as f:
    content = f.read()

# New keys and translations for the Cabinet
new_translations = {
    'AZ': {
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
        "cab-edit-btn": "Redaktə et"
    },
    'ENG': {
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
        "cab-edit-btn": "Edit"
    },
    'RUS': {
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
        "cab-edit-btn": "Редактировать"
    }
}

if "cabinet-title" not in content:
    for lang in ['AZ', 'ENG', 'RUS']:
        # We find the favorite entry just to have a pivot where we can inject our code.
        # It's at the end of each block: `"fav-empty-a": "..."`
        # We will match `"fav-empty-a": "(.*?)"` and insert the new keys after it.
        
        # Build the block of new keys
        lines = []
        for k, v in new_translations[lang].items():
            lines.append(f'      "{k}": "{v}"')
        
        new_block = ",\n" + ",\n".join(lines)
        
        # We need to make sure we replace it only once per language block. To do this safely,
        # we can just use re.sub with count=1 inside a specific boundary, but since they are
        # different values across languages, we might actually match the exact line if we look at the file.
        # Actually, let's just insert it right before the closing brace `}` of the entire translations[lang] block.
        # A simpler way: Find the block of translations['AZ']
        # But wait, it's a TS object.
        pass

# Safe patch using ast is not possible, let's just do a specific regex based on a known key
# In AZ: `"fav-empty-a": "Elanlara baxın"`
# In ENG: `"fav-empty-a": "View ads"`
# In RUS: `"fav-empty-a": "Посмотреть объявления"`

anchors = {
    'AZ': '"fav-empty-a": "Elanlara baxın"',
    'ENG': '"fav-empty-a": "View ads"',
    'RUS': '"fav-empty-a": "Посмотреть объявления"'
}

if '"cabinet-title"' not in content:
    for lang in ['AZ', 'ENG', 'RUS']:
        anchor = anchors[lang]
        
        # Build the new string
        lines = []
        for k, v in new_translations[lang].items():
            lines.append(f'      "{k}": "{v}"')
        
        new_block = anchor + ",\n" + ",\n".join(lines)
        
        content = content.replace(anchor, new_block, 1)

    with open(script_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Added translating keys for Cabinet successfully.")
else:
    print("Keys already present.")

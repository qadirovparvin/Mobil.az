const fs = require('fs');
let content = fs.readFileSync('JS/script.js', 'utf8');

const regex = /const storeNames = \[[\s\S]*?\];/;
const replacement = \const storesData = [
            { name: "LeadTech Mobile", logo: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200", badge: "Pro", loc: "Baki, 28 May m/s", time: "09:00 – 21:00", rating: "4.9", active: "127", sales: "2.4K", follows: "3.1K", desc: "LeadTech Mobile r?smi magazamizdan satilir. Bütün m?hsullar orijinaldir v? r?smi distribyütor vasit?sil? g?tirilir." },
            { name: "Kontakt Home", logo: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=200", badge: "Elite", loc: "Baki, G?nclik Mall", time: "10:00 – 22:00", rating: "4.8", active: "542", sales: "15K", follows: "52K", desc: "Kontakt Home - Sevindir?n s?b?k?. Magazalarimizda r?smi z?man?t v? s?rf?li kredit s?rtl?ri mövcuddur." },
            { name: "Irsad", logo: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=200", badge: "Pro", loc: "Baki, N?rimanov", time: "09:00 – 21:00", rating: "4.7", active: "310", sales: "8K", follows: "25K", desc: "Irsad - Yasa, Yarat, Paylas! ?n son texnologiya artiq siz? daha yaxindir. Ilkin öd?nissiz kredit." },
            { name: "Baku Electronics", logo: "https://images.unsplash.com/photo-1550005973-587922d326f2?q=80&w=200", badge: "Elite", loc: "Baki, 20 Yanvar m/s", time: "10:00 – 21:00", rating: "4.8", active: "480", sales: "12K", follows: "40K", desc: "Baku Electronics - h?r zaman yenilikçi! Telefon v? elektronikada ?n genis çesid v? z?man?tli m?hsullar." },
            { name: "Maxi.az", logo: "https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?q=80&w=200", badge: "Pro", loc: "Baki, D?niz Mall", time: "10:00 – 22:00", rating: "4.9", active: "215", sales: "5K", follows: "12K", desc: "Maxi.az il? f?rqi hiss et! T?hlük?siz alis-veris, sür?tli çatdirilma v? r?smi z?man?t." },
            { name: "Music Gallery", logo: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=200", badge: "Standart", loc: "Baki, X?tai", time: "10:00 – 20:00", rating: "4.6", active: "95", sales: "1.2K", follows: "4K", desc: "Music Gallery - Premium elektronika üzr? müt?x?ssisiniz. Yüks?k xidm?t s?viyy?si v? orijinal mallar." },
            { name: "Smart Store", logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200", badge: "Standart", loc: "Sumqayit, M?rk?z", time: "09:00 – 20:00", rating: "4.5", active: "60", sales: "800", follows: "2.1K", desc: "Smart Store Sumqayit söb?si. Ikinci ?l v? yeni cihazlar üçün ideal seçim, barter xidm?ti aktivdir." },
            { name: "Alma Store", logo: "https://images.unsplash.com/photo-1611406560410-09b9eb210c4f?q=80&w=200", badge: "Premium", loc: "Baki, Port Baku", time: "10:00 – 22:00", rating: "5.0", active: "45", sales: "3K", follows: "18K", desc: "Alma Store -  Apple Premium Reseller. Bütün Apple ekosistemi üçün r?smi z?man?t v? orijinal aksesuarlar." },
            { name: "World Telecom", logo: "https://images.unsplash.com/photo-1550009158-9ebf6d250400?q=80&w=200", badge: "Pro", loc: "G?nc?, G?nc? Mall", time: "09:00 – 21:00", rating: "4.7", active: "150", sales: "4K", follows: "8K", desc: "World Telecom il? dünyaya baglan! Yeni modell?r ?n s?rf?li qiym?t?." }
        ];\;

content = content.replace(regex, replacement);

const storeLogicRegex = /const storeNameEl = document\.querySelector\('\.store-card-name'\);[\s\S]*?\}\s*\}/;
const storeLogicReplacement = \const storeCardEl = document.querySelector('.store-seller-card');
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
                    badgeHtml = ' <i class="fas fa-crown" style="color:#ffd700;" title="Premium Magaza"></i> <span class="store-badge-inline" style="background:linear-gradient(135deg,#c8a600,#ffd700);color:#333;"><i class="fas fa-crown"></i> ' + store.badge + '</span>';
                } else if (store.badge === 'Pro') {
                    badgeHtml = ' <i class="fas fa-check-circle s-verified" title="R?smi Magaza"></i> <span class="store-badge-inline"><i class="fas fa-star"></i> Pro</span>';
                } else {
                    badgeHtml = ' <span class="store-badge-inline" style="background:#555;"><i class="fas fa-store"></i> Magaza</span>';
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
                // Prepend the store specific description
                let existingText = descEl.innerHTML;
                descEl.innerHTML = '<strong>' + store.name + '</strong> — ' + store.desc + '<br><br>' + existingText.replace(/Samsung Galaxy.*?satilir\./, '');
                descEl.dataset.updated = 'true';
            }
        }\;

content = content.replace(storeLogicRegex, storeLogicReplacement);
fs.writeFileSync('JS/script.js', content);
console.log('Done');

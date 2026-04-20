const fs = require('fs');
let content = fs.readFileSync('JS/script.js', 'utf8');

const injection = 
    // --- RANDOMIZE SELLER PROFILE FOR AD DETAIL PAGES ----------------------------
    function randomizeSellerProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        let adId = parseInt(urlParams.get('id'));
        if (!adId || isNaN(adId)) adId = 1;

        const fakeRandom = function(seed) {
            let x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const privateNames = ["Elçin M?mm?dov", "?li Qasimov", "Tural ?liyev", "Vüqar R?himov", "Samir H?s?nov", "Nigar Quliyeva", "Ayt?n R?himova", "K?nan S?f?rov", "R?sad N?biyev", "Elnur Qarayev"];
        const storeNames = ["LeadTech Mobile", "Baku Electronics", "Kontakt Home", "Irshad", "Maxi.az", "Music Gallery", "NoteComp", "Smart Store", "Galaxy Shop", "Tech Home"];

        const personalNameEl = document.querySelector('.personal-name');
        if (personalNameEl) {
            let nameIndex = Math.floor(fakeRandom(adId * 10) * privateNames.length);
            let name = privateNames[nameIndex];
            personalNameEl.textContent = name;
            
            let avatarEl = document.querySelector('.personal-avatar');
            if (avatarEl) {
                avatarEl.textContent = name.charAt(0);
                let hue = Math.floor(fakeRandom(adId * 20) * 360);
                avatarEl.style.background = \linear-gradient(135deg, hsl(\, 70%, 50%), hsl(\, 70%, 50%))\;
            }

            let statEls = document.querySelectorAll('.personal-stats .val');
            if (statEls.length >= 3) {
                statEls[0].textContent = Math.floor(fakeRandom(adId * 30) * 50) + 1; // Ads shared
                statEls[1].textContent = (4.0 + fakeRandom(adId * 40)).toFixed(1); // Rating
                statEls[2].textContent = Math.floor(90 + fakeRandom(adId * 50) * 10) + '%'; // Positive
            }
        }

        const storeNameEl = document.querySelector('.store-card-name');
        if (storeNameEl) {
            let nameIndex = Math.floor(fakeRandom(adId * 15) * storeNames.length);
            let name = storeNames[nameIndex];
            
            // Remove text node logic to preserve badges
            let childNodes = Array.from(storeNameEl.childNodes);
            for (let node of childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                    node.textContent = name + ' ';
                    break;
                }
            }
        }
    }
    randomizeSellerProfile();
;

content = content.replace(/initTheme\(\);\r?\n\}\);/, "initTheme();\n" + injection + "\n});");
fs.writeFileSync('JS/script.js', content);
console.log('Script injected');

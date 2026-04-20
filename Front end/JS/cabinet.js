/**
 * Cabinet Interactivity Logic (cabinet.js)
 * Handles custom toast notifications, mock filtering, and mock chat integrations.
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==============================
       1. Toast Notification System
       ============================== */
    class ToastNotifier {
        constructor() {
            // Create container if it doesn't exist
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
            if(type === 'success') iconClass = 'fas fa-check';
            if(type === 'warning') iconClass = 'fas fa-exclamation';

            toast.innerHTML = `
                <div class="cab-toast-icon"><i class="${iconClass}"></i></div>
                <span>${message}</span>
            `;

            this.container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);

            // Remove logic
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400); // wait for exit animation
            }, duration);
        }
    }

    window.toast = new ToastNotifier();
    const toast = window.toast;

    /* ==============================
       2. General Action Buttons
       ============================== */
    
    // Wallet Buttons
    const walletBtns = document.querySelectorAll('.btn-wallet');
    walletBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.innerText.trim();
            if (action.includes('Artır')) {
                toast.show('Ödəmə sisteminə yönləndirilir...', 'info');
            } else if (action.includes('Paket')) {
                window.location.href = 'create-shop.html';
            }
        });
    });

    // Form Save Buttons (Settings)
    const settingsBtns = document.querySelectorAll('.settings-panel .btn-primary');
    settingsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const originalText = btn.innerText;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Yüklənir...`;
            btn.style.opacity = '0.7';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                toast.show('Dəyişikliklər vurğulandı və yadda saxlanıldı!', 'success');
            }, 800);
        });
    });

    /* ==============================
       3. Ad Filters & Actions
       ============================== */
    
    const filterPills = document.querySelectorAll('.ad-filters .filter-pill');
    const adItems = document.querySelectorAll('.my-ad-item');

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active state
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filterType = pill.getAttribute('data-filter') || 'all';

            // Filter the DOM visually
            adItems.forEach(ad => {
                const status = ad.getAttribute('data-status');
                if (filterType === 'all' || status === filterType) {
                    ad.style.display = 'flex';
                    // small animation effect
                    ad.style.animation = 'none';
                    setTimeout(() => ad.style.animation = 'cabFadeIn 0.3s ease', 10);
                } else {
                    ad.style.display = 'none';
                }
            });
        });
    });

    // Boost, Edit, Delete Buttons
    document.querySelectorAll('.btn-boost').forEach(btn => {
        btn.addEventListener('click', () => {
            toast.show('Elan uğurla irəli çəkildi! Balansdan çıxıldı.', 'success');
        });
    });

    document.querySelectorAll('.my-ad-actions .delete-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find parent ad item
            const adItem = e.target.closest('.my-ad-item');
            if (confirm('Bu elanı silmək istədiyinizdən əminsiniz?')) {
                adItem.style.opacity = '0';
                adItem.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    adItem.remove();
                    toast.show('Elan silindi.', 'warning');
                }, 300);
            }
        });
    });

    document.querySelectorAll('.my-ad-actions .edit-action').forEach(btn => {
        btn.addEventListener('click', () => {
             toast.show('Redaktə səhifəsinə yönləndirilir...', 'info');
             setTimeout(() => { window.location.href = 'elan-yerlesdir.html'; }, 800);
        });
    });

    /* ==============================
       4. Messenger Simulation (Two-Column Chat)
       ============================== */
    
    const chatContacts = document.querySelectorAll('.chat-contact');
    const chatHeaderName = document.querySelector('.chat-header-info h3');
    const chatHeaderSub = document.querySelector('.chat-header-info p');
    const chatMessagesContainer = document.querySelector('.chat-messages');
    
    // Switch contact mock
    chatContacts.forEach(contact => {
        contact.addEventListener('click', () => {
            // Update active styling
            chatContacts.forEach(c => c.classList.remove('active'));
            contact.classList.add('active');
            contact.classList.remove('unread'); // mark read

            const name = contact.querySelector('h4').innerText;
            chatHeaderName.innerText = name;

            // Simple mock message reloading
            chatMessagesContainer.innerHTML = `
                <div class="bubble bubble-received">
                    Salam, mən ${name}. Bu elanla bağlı yazıram.
                    <span class="bubble-time">${new Date().toLocaleTimeString('az-AZ', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;
        });
    });

    // Send Message Input logic
    const sendBtn = document.querySelector('.btn-send');
    const chatInput = document.querySelector('.chat-input input');

    function sendMessage() {
        const text = chatInput.value.trim();
        if (text !== '') {
            const time = new Date().toLocaleTimeString('az-AZ', {hour: '2-digit', minute:'2-digit'});
            const bubble = document.createElement('div');
            bubble.className = 'bubble bubble-sent';
            bubble.innerHTML = `
                ${text}
                <span class="bubble-time">${time}</span>
            `;
            chatMessagesContainer.appendChild(bubble);
            chatInput.value = '';
            
            // Scroll to bottom
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    /* ==============================
       5. Danger Zone & Social Actions
       ============================== */
    
    // Account Freeze / Delete
    const freezeBtn = document.querySelector('.btn-outline-warning');
    const deleteBtn = document.querySelector('.btn-outline-danger');

    if (freezeBtn) {
        freezeBtn.addEventListener('click', () => {
            if (confirm('Hesabınızı dondurmaq istədiyinizdən əminsiniz? Bütün elanlarınız gizlədiləcək.')) {
                toast.show('Hesabınız uğurla donduruldu. Çıxış edilir...', 'warning', 3000);
                // Backend integration goes here
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
             if (confirm('DİQQƏT: Hesabınızı həmişəlik silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz!')) {
                toast.show('Hesabınız həmişəlik silindi.', 'warning', 3000);
                // Backend integration goes here
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            }
        });
    }

    // Social Connect / Disconnect mock
    document.querySelectorAll('.btn-connect').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toast.show('Platformaya yönləndirilir...', 'info');
            setTimeout(() => {
                const card = btn.closest('.social-connect-card');
                card.classList.add('connected');
                const infoSpan = card.querySelector('.social-info span');
                infoSpan.innerText = 'Bağlandı';
                btn.outerHTML = '<button class="btn-disconnect" aria-label="Ayır"><i class="fas fa-times"></i></button>';
                toast.show('Hesab uğurla bağlandı!', 'success');
            }, 1000);
        });
    });

    document.addEventListener('click', function(e) {
        if(e.target && (e.target.className === 'btn-disconnect' || e.target.closest('.btn-disconnect'))) {
            if(confirm('Bu sosial hesabı ayırmaq istədiyinizdən əminsiniz?')) {
                const card = e.target.closest('.social-connect-card');
                if (card) {
                    card.classList.remove('connected');
                    const infoSpan = card.querySelector('.social-info span');
                    if (infoSpan) infoSpan.innerText = 'Bağlanmayıb';
                    
                    const btnObj = e.target.closest('.btn-disconnect');
                    btnObj.outerHTML = '<button class="btn-connect">Bağla</button>';
                    toast.show('Sosial hesab ayrıldı.', 'warning');
                }
            }
        }
    });

});

/* ==============================
   6. Monetization & Referral Logic (Global)
   ============================== */

let currentPromoAdId = null;
let selectedPkg = 'bump';
let selectedDuration = 1;
let userWalletBalance = 0.00;
let userReferralBalance = 15.00;

const prices = {
    bump: { 1: 1.00 },
    vip: { 1: 2.00, 3: 4.00 },
    pro: { 1: 4.00, 3: 8.00 }
};

window.openPromotionModal = function(adId) {
    currentPromoAdId = adId;
    const modal = document.getElementById('promotionModal');
    if (modal) {
        modal.classList.add('active');
        selectPackage('bump'); // default
    }
};

window.closePromotionModal = function() {
    const modal = document.getElementById('promotionModal');
    if (modal) modal.classList.remove('active');
};

window.selectPackage = function(pkg) {
    selectedPkg = pkg;
    
    // Update UI
    document.querySelectorAll('.promo-pkg-card').forEach(card => {
        const input = card.querySelector('input');
        if(input.value === pkg) input.checked = true;
    });

    const tierSelector = document.getElementById('tierSelector');
    if (tierSelector) {
        if (pkg === 'bump') {
            tierSelector.style.display = 'none';
            selectedDuration = 1;
        } else {
            tierSelector.style.display = 'block';
            setDuration(selectedDuration);
        }
    }
    updateTotal();
};

window.setDuration = function(days) {
    selectedDuration = days;
    document.querySelectorAll('.btn-tier').forEach(btn => {
        if(parseInt(btn.getAttribute('data-days')) === days) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    updateTotal();
};

window.updateTotal = function() {
    let price = prices[selectedPkg][selectedDuration] || 0;
    const checkbox = document.getElementById('useReferralCredit');
    const finalPriceElem = document.getElementById('finalPrice');
    
    if (checkbox && checkbox.checked) {
        let maxDiscount = price * 0.5;
        let actualDiscount = Math.min(maxDiscount, userReferralBalance);
        price -= actualDiscount;
    }

    if (finalPriceElem) finalPriceElem.innerText = price.toFixed(2) + ' AZN';
};

window.confirmPromotion = function() {
    const btn = document.getElementById('btnPayPromo');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Gözləyin...`;
    btn.disabled = true;

    // Use a small helper to get toast if not global
    const t = window.toast || { show: (m) => alert(m) };

    setTimeout(() => {
        t.show('Ödəniş uğurla tamamlandı! Elanınızın statusu yeniləndi.', 'success');
        closePromotionModal();
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        const checkbox = document.getElementById('useReferralCredit');
        if (checkbox) checkbox.checked = false;
    }, 1500);
};

window.copyReferralLink = function() {
    const linkInput = document.getElementById('referralLink');
    if (!linkInput) return;

    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(linkInput.value);
    
    const t = window.toast || { show: (m) => alert(m) };
    t.show('Referal linki kopyalandı!', 'success');
};


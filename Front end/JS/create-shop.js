const API_BASE = window.API_URL || window.API_BASE || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api');

// ── Package Selection ──────────────────────────────────
const packageData = {
    starter: { name: 'Başlanğıc paketi seçildi', desc: '15 aktiv elan · Pulsuz', color: '#86868b' },
    pro:     { name: 'Pro Mağaza paketi seçildi', desc: '50 elan · Mavi nişan · ₼10/ay', color: '#5e5ce6' },
    elite:   { name: 'Premium paketi seçildi', desc: 'Limitsiz elan · Qızıl tac · ₼22/ay', color: '#d4a200' }
};

let currentPackage = 'Pro';

window.selectPackage = function(pkgKey, el) {
    // Remove highlight from all cards
    document.querySelectorAll('.package-card').forEach(c => {
        if (!c.classList.contains('popular')) {
            c.style.borderColor = '';
            c.style.boxShadow = '';
        }
    });

    const data = packageData[pkgKey];
    
    // Map pkgKey to correct packageType for backend
    if (pkgKey === 'starter') currentPackage = 'Starter';
    if (pkgKey === 'pro') currentPackage = 'Pro';
    if (pkgKey === 'elite') currentPackage = 'Premium';

    // Update indicator
    const nameEl = document.getElementById('selectedPkgName');
    const descEl = document.getElementById('selectedPkgDesc');
    const iconEl = document.querySelector('.selected-package-info i');
    
    if(nameEl) nameEl.textContent = data.name;
    if(descEl) descEl.textContent = data.desc;
    if(iconEl) iconEl.style.color = data.color;

    // Highlight chosen card
    if (el) {
        el.style.borderColor = data.color;
        el.style.boxShadow = `0 20px 50px ${data.color}33`;
    }
};

// ── Logo Preview ──────────────────────────────────────
let selectedLogoFile = null;

window.previewLogo = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedLogoFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        const area = document.querySelector('.logo-upload-area');
        if(area) {
            area.innerHTML = `<img src="${e.target.result}" alt="Logo" style="max-height:120px;border-radius:12px;margin:0 auto;">
                              <p style="margin-top:10px;font-size:13px;color:var(--text-secondary)">${file.name}</p>`;
        }
    };
    reader.readAsDataURL(file);
};

// ── FAQ Accordion ─────────────────────────────────────
window.toggleFaq = function(btn) {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
};

// ── Payment Method ────────────────────────────────────
window.selectPayment = function(method, element) {
    document.querySelectorAll('.payment-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    const paymentMethodEl = document.getElementById('paymentMethod');
    if(paymentMethodEl) paymentMethodEl.value = method;
    
    // Toggle payment detail blocks
    document.querySelectorAll('.payment-details').forEach(div => div.style.display = 'none');
    const detailsDiv = document.getElementById('payment-details-' + method);
    if(detailsDiv) {
        detailsDiv.style.display = 'block';
    }
};

// Initialize with pro selected
document.addEventListener('DOMContentLoaded', () => {
    const proEl = document.getElementById('pkg-pro');
    if(proEl) selectPackage('pro', proEl);
});

// ── Form Submit ───────────────────────────────────────
const shopForm = document.getElementById('shopForm');
if (shopForm) {
    shopForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // FIX BUG #3: Use centralized auth instead of hardcoded sessionStorage
        const token = (typeof window.getAuthToken === 'function' ? window.getAuthToken() : null) || sessionStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('token');

        if (!token) {
            alert('Mağaza açmaq üçün əvvəlcə daxil olmalısınız.');
            window.location.href = 'login.html';
            return;
        }

        const btn = document.querySelector('.btn-submit-shop');
        const originalBtnText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';
        btn.disabled = true;

        try {
            // Collect data
            const payload = {
                storeName: document.getElementById('storeName').value,
                contactNumber: document.getElementById('phone').value,
                city: document.getElementById('city').value,
                address: document.getElementById('address')?.value || '',
                description: document.getElementById('description')?.value || '',
                packageType: currentPackage,
                socialLinks: {
                    whatsapp: document.getElementById('whatsapp')?.value || '',
                    instagram: document.getElementById('instagram')?.value || ''
                }
            };

            // Upload selectedLogoFile to backend single-image upload API
            if (selectedLogoFile) {
                const formData = new FormData();
                formData.append('image', selectedLogoFile);

                const uploadRes = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (!uploadRes.ok) {
                    const uploadErr = await uploadRes.json();
                    throw new Error(uploadErr.message || 'Logo yüklənmə xətası');
                }

                const uploadData = await uploadRes.json();
                payload.logoUrl = uploadData.url;
            }

            const response = await fetch(`${API_BASE}/stores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Müraciətiniz Qəbul Edildi!';
                btn.style.background = 'linear-gradient(135deg, #34c759, #28a745)';
                
                setTimeout(() => {
                    // Redirect to the new store's profile
                    window.location.href = `magaza-profil.html?id=${data._id}`;
                }, 1500);
            } else {
                throw new Error(data.message || 'Xəta baş verdi');
            }
        } catch (error) {
            alert(error.message);
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
        }
    });
}

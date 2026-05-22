/* =========================================================
   CATEGORY → BRAND → MODEL DATA
   ========================================================= */

const CATALOG = {
  Telefon: {
    Apple: [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini', 'iPhone 13',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini', 'iPhone 12',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
      'iPhone SE (3rd gen)', 'iPhone SE (2nd gen)',
      'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7', 'Digər model',
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
      'Galaxy Note 20 Ultra', 'Galaxy Note 20', 'Digər model',
    ],
    Xiaomi: [
      'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
      'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13',
      'Xiaomi 12 Pro', 'Xiaomi 12', 'Xiaomi 12 Lite',
      'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
      'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
      'Redmi 13C', 'Redmi 12', 'Redmi 10C',
      'POCO X6 Pro', 'POCO X6', 'POCO X5 Pro', 'POCO X5',
      'POCO M6 Pro', 'POCO M5', 'POCO F5 Pro', 'POCO F5', 'Digər model',
    ],
    Huawei: [
      'Pura 70 Ultra', 'Pura 70 Pro+', 'Pura 70 Pro', 'Pura 70',
      'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60',
      'P60 Pro', 'P60 Art', 'P60', 'P50 Pro', 'P50',
      'Nova 12 Pro', 'Nova 12 Ultra', 'Nova 12',
      'Nova 11 Pro', 'Nova 11 Ultra', 'Nova 11',
      'Nova 10 Pro', 'Nova 10 SE', 'Y90', 'Y72', 'Y62', 'Digər model',
    ],
    OPPO: [
      'Find X8 Pro', 'Find X8', 'Find X7 Ultra', 'Find X7',
      'Find X6 Pro', 'Find X6',
      'Reno 12 Pro', 'Reno 12 F', 'Reno 12',
      'Reno 11 Pro', 'Reno 11 F', 'Reno 11',
      'Reno 10 Pro+', 'Reno 10 Pro', 'Reno 10',
      'A3 Pro', 'A3', 'A78', 'A77', 'A55', 'Digər model',
    ],
    Vivo: [
      'X100 Ultra', 'X100 Pro', 'X100',
      'X90 Pro', 'X90',
      'V30 Pro', 'V30 Lite', 'V30',
      'V29 Pro', 'V29 Lite', 'V29',
      'V27 Pro', 'V27 Lite', 'V27',
      'Y200 Pro', 'Y200', 'Y100', 'Y78', 'Y55', 'Y36', 'Digər model',
    ],
    Honor: [
      'Magic 6 Pro', 'Magic 6 Ultimate', 'Magic 6',
      'Magic 5 Pro', 'Magic 5 Ultimate', 'Magic 5',
      '90 Smart', '90', '90 Pro',
      'X9b', 'X8b', 'X7b',
      'Play 8T', 'Play 7T', 'Play 6T', 'Digər model',
    ],
    Realme: [
      'GT 6T', 'GT 6', 'GT 5 Pro', 'GT 5',
      '12 Pro+ 5G', '12 Pro 5G', '12 5G',
      '11 Pro+ 5G', '11 Pro 5G', '11 5G',
      'C67', 'C55', 'C53', 'C35', 'C33',
      'Narzo 70 Pro', 'Narzo 60 Pro', 'Narzo 50', 'Digər model',
    ],
    Nokia: [
      'Nokia G42', 'Nokia G22', 'Nokia G21', 'Nokia G11',
      'Nokia C32', 'Nokia C22', 'Nokia C12', 'Nokia C12+',
      'Nokia XR21', 'Nokia XR20', 'Nokia 5710 XpressAudio', 'Digər model',
    ],
    Diger: ['Digər model'],
  },

  Planşet: {
    Apple: [
      'iPad Pro 13" (M4)', 'iPad Pro 11" (M4)',
      'iPad Pro 13" (M2)', 'iPad Pro 11" (M2)',
      'iPad Air 13" (M2)', 'iPad Air 11" (M2)',
      'iPad Air (M1)', 'iPad Air (5th gen)',
      'iPad mini 7', 'iPad mini 6',
      'iPad (10th gen)', 'iPad (9th gen)', 'iPad (8th gen)', 'Digər model',
    ],
    Samsung: [
      'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE',
      'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8',
      'Galaxy Tab S7 FE', 'Galaxy Tab S7+', 'Galaxy Tab S7',
      'Galaxy Tab A9+', 'Galaxy Tab A9', 'Galaxy Tab A8', 'Galaxy Tab A7 Lite', 'Digər model',
    ],
    Xiaomi: [
      'Xiaomi Pad 6S Pro', 'Xiaomi Pad 6 Pro', 'Xiaomi Pad 6',
      'Xiaomi Pad 5 Pro', 'Xiaomi Pad 5',
      'Redmi Pad SE', 'Redmi Pad Pro', 'Redmi Pad', 'Digər model',
    ],
    Huawei: [
      'MatePad Pro 13.2"', 'MatePad Pro 11"',
      'MatePad 11.5" S', 'MatePad 11.5"', 'MatePad 11"',
      'MatePad SE 11"', 'MatePad SE 10.4"',
      'MatePad T10s', 'MatePad T10', 'Digər model',
    ],
    Lenovo: [
      'Tab P12 Pro', 'Tab P12', 'Tab P11 Pro Gen 2',
      'Tab P11 Gen 2', 'Tab P11', 'Tab M10 Plus Gen 3',
      'Tab M10 HD Gen 2', 'Tab M8 Gen 3', 'Digər model',
    ],
    OPPO: [
      'Pad 2', 'Pad Air 2', 'Pad Air', 'Digər model',
    ],
    Diger: ['Digər model'],
  },

  Aksesuar: {
    'Qulaqlıq': [
      'AirPods Pro 2', 'AirPods 4', 'AirPods 3', 'AirPods Max',
      'Samsung Galaxy Buds3 Pro', 'Samsung Galaxy Buds3',
      'Samsung Galaxy Buds2 Pro', 'Samsung Galaxy Buds2',
      'Sony WH-1000XM5', 'Sony WH-1000XM4', 'Sony WF-1000XM5',
      'JBL Tune 770NC', 'JBL Tune 760NC', 'JBL Live Pro 2',
      'Xiaomi Buds 4 Pro', 'Xiaomi Buds 4',
      'Huawei FreeBuds 6i', 'Huawei FreeBuds Pro 3',
      'Baseus qulaqlıq', 'Digər model',
    ],
    'Şarj cihazı': [
      'Apple 20W USB-C', 'Apple 30W MagSafe', 'Apple 35W Dual',
      'Samsung 25W Super Fast', 'Samsung 45W',
      'Xiaomi 67W Turbo', 'Xiaomi 120W HyperCharge',
      'Huawei 66W SuperCharge', 'Anker 65W GaN', 'Digər model',
    ],
    'Kabellər': [
      'Lightning kabel', 'USB-C kabel', 'MicroUSB kabel',
      'MagSafe kabel', 'Type-C to Lightning', 'HDMI kabel', 'Digər model',
    ],
    'Qoruyucu örtük': [
      'iPhone üçün keys', 'Samsung üçün keys',
      'Xiaomi üçün keys', 'Huawei üçün keys',
      'Universal keys', 'Flip keys', 'Şüşə keys', 'Digər model',
    ],
    'Ekran qoruyucu': [
      'iPhone tempered glass', 'Samsung tempered glass',
      'Xiaomi tempered glass', 'Universal ekran qoruyucu', 'Digər model',
    ],
    'Power Bank': [
      'Xiaomi Power Bank 10000mAh', 'Xiaomi Power Bank 20000mAh',
      'Anker PowerCore 10000', 'Anker PowerCore 20000',
      'Samsung Power Bank 10000mAh',
      'Baseus 20000mAh', 'Baseus 30000mAh', 'Digər model',
    ],
    'Digər aksesuar': ['Digər model'],
  },

  'Qulaqlıq': {
    'Apple': [
      'AirPods Pro 2', 'AirPods 4', 'AirPods 3', 'AirPods Max (USB-C)', 'AirPods Max', 'Digər model',
    ],
    'Samsung': [
      'Galaxy Buds3 Pro', 'Galaxy Buds3', 'Galaxy Buds2 Pro', 'Galaxy Buds2',
      'Galaxy Buds FE', 'Galaxy Buds Live', 'Digər model',
    ],
    'Sony': [
      'WH-1000XM5', 'WH-1000XM4', 'WH-CH720N', 'WH-CH520',
      'WF-1000XM5', 'WF-1000XM4', 'LinkBuds S', 'LinkBuds Open', 'Digər model',
    ],
    'JBL': [
      'Tune 770NC', 'Tune 760NC', 'Tune 670NC', 'Tune 520BT',
      'Live Pro 2', 'Live Flex', 'Vibe Beam', 'Free NC+', 'Digər model',
    ],
    'Xiaomi': [
      'Buds 5 Pro', 'Buds 5', 'Buds 4 Pro', 'Buds 4',
      'Redmi Buds 6 Pro', 'Redmi Buds 6', 'Redmi Buds 5 Pro', 'Digər model',
    ],
    'Huawei': [
      'FreeBuds Pro 3', 'FreeBuds Pro 2', 'FreeBuds 6i',
      'FreeBuds 5i', 'FreeBuds SE 2', 'FreeLace Pro 2', 'Digər model',
    ],
    'Baseus': [
      'Bowie EZ10', 'Bowie MA10', 'Bowie WM02',
      'Encok W04', 'Encok H04', 'Digər model',
    ],
    'Digər': ['Digər model'],
  },
};

/* =========================================================
   BRAND SELECT — update on category change
   ========================================================= */
const categorySelect = document.getElementById('category');
const brandSelect = document.getElementById('brand');
const modelSelect = document.getElementById('model');

function clearSelect(sel, placeholder) {
  sel.innerHTML = '';
  const opt = document.createElement('option');
  opt.disabled = true;
  opt.selected = true;
  opt.value = '';
  opt.textContent = placeholder;
  sel.appendChild(opt);
}

function populateBrands(category) {
  clearSelect(brandSelect, _t.brandPlaceholder);
  clearSelect(modelSelect, _t.modelPlaceholderCat);

  if (!category || !CATALOG[category]) return;

  Object.keys(CATALOG[category]).forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand;
    // Show translated label for the "other" sentinel key
    const isOther = brand === 'Diger' || brand === 'Digər';
    opt.textContent = isOther ? _t.digerLabel : brand;
    brandSelect.appendChild(opt);
  });
}

function populateModels(category, brand) {
  clearSelect(modelSelect, _t.modelPlaceholderBrand);
  if (!category || !brand || !CATALOG[category] || !CATALOG[category][brand]) return;

  CATALOG[category][brand].forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    // Translate the generic "other model" sentinel
    opt.textContent = (m === 'Digər model') ? _t.digerModel : m;
    modelSelect.appendChild(opt);
  });
}

// Translation strings for dynamic placeholders — updated via langchange
let _t = {
  brandPlaceholder: 'Əvvəlcə kateqoriya seçin',
  modelPlaceholderCat: 'Əvvəlcə kateqoriya seçin',
  modelPlaceholderBrand: 'Model seçin',
  digerLabel: 'Digər',
  digerModel: 'Digər model',
};

// Initialize — no category chosen yet
clearSelect(brandSelect, _t.brandPlaceholder);
clearSelect(modelSelect, _t.modelPlaceholderCat);

// Sync with the central language switcher
document.addEventListener('langchange', (e) => {
  const t = e.detail.t;
  if (!t) return;
  _t.brandPlaceholder = t['opt-brand-placeholder'] || _t.brandPlaceholder;
  _t.modelPlaceholderCat = t['opt-model-placeholder-cat'] || _t.modelPlaceholderCat;
  _t.modelPlaceholderBrand = t['opt-model-placeholder-brand'] || _t.modelPlaceholderBrand;
  _t.digerLabel = t['opt-diger-brand'] || _t.digerLabel;
  _t.digerModel = t['opt-diger-model'] || _t.digerModel;

  // Re-apply placeholder if brand/model still show the "choose category" message
  const brandOpt = brandSelect.options[0];
  if (brandOpt && brandOpt.disabled) brandOpt.textContent = _t.brandPlaceholder;

  const modelOpt = modelSelect.options[0];
  if (modelOpt && modelOpt.disabled) {
    // If no brand selected yet, keep "category" message; otherwise "brand" message
    modelOpt.textContent = categorySelect.value
      ? _t.modelPlaceholderBrand
      : _t.modelPlaceholderCat;
  }

  // Re-render current brand list with translated labels if a category is already selected
  if (categorySelect.value) {
    const currentBrand = brandSelect.value;
    populateBrands(categorySelect.value);
    if (currentBrand) {
      brandSelect.value = currentBrand;
      populateModels(categorySelect.value, currentBrand);
    }
  }
});

categorySelect.addEventListener('change', () => {
  populateBrands(categorySelect.value);
});

brandSelect.addEventListener('change', () => {
  populateModels(categorySelect.value, brandSelect.value);
});

/* =========================================================
   DESCRIPTION CHARACTER COUNTER
   ========================================================= */
const descArea = document.getElementById('description');
const descCount = document.getElementById('descCount');

if (descArea && descCount) {
  descArea.addEventListener('input', () => {
    const len = descArea.value.length;
    descCount.textContent = len;
    descCount.style.color = len > 950 ? '#e8445a' : '#999';
    if (descArea.value.length > 1000) {
      descArea.value = descArea.value.slice(0, 1000);
    }
  });
}

/* =========================================================
   DRAG & DROP + IMAGE PREVIEW
   ========================================================= */
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('images');
const previewGrid = document.getElementById('imagePreviewGrid');

function renderPreviews(files) {
  previewGrid.innerHTML = '';
  const arr = Array.from(files).slice(0, 10);
  arr.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-thumb';
      img.alt = file.name;
      previewGrid.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
  if (arr.length > 0) {
    const p = fileUploadArea.querySelector('.file-upload-content p');
    if (p) p.innerHTML = `<strong>${arr.length} şəkil seçildi</strong> — dəyişmək üçün yenidən seçin`;
  }
}

fileInput.addEventListener('change', () => renderPreviews(fileInput.files));

fileUploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  fileUploadArea.classList.add('dragover');
});
fileUploadArea.addEventListener('dragleave', () => fileUploadArea.classList.remove('dragover'));
fileUploadArea.addEventListener('drop', e => {
  e.preventDefault();
  fileUploadArea.classList.remove('dragover');
  const dt = e.dataTransfer;
  if (dt.files.length) {
    const dataTransfer = new DataTransfer();
    Array.from(dt.files).slice(0, 10).forEach(f => dataTransfer.items.add(f));
    fileInput.files = dataTransfer.files;
    renderPreviews(fileInput.files);
  }
});

/* =========================================================
   FORM SUBMIT — POST to real backend API
   ========================================================= */

const API_BASE = window.API_URL || localStorage.getItem('apiUrl') || 'http://localhost:5000/api';

document.getElementById('adForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // ── 1. Auth guard ───────────────────────────────────────
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Elan yerləşdirmək üçün hesabınıza daxil olun.');
    window.location.href = 'login.html';
    return;
  }

  // ── 2. Basic validation ─────────────────────────────────
  const category = categorySelect.value;
  const brand    = brandSelect.value;
  const model    = modelSelect.value;
  const price    = document.getElementById('price').value;
  const phone    = document.getElementById('phone').value;
  const cityEl   = document.getElementById('city');
  const city     = cityEl.value;

  if (!category)           { alert('Zəhmət olmasa kateqoriya seçin.');  return; }
  if (!brand)              { alert('Zəhmət olmasa marka seçin.');       return; }
  if (!model)              { alert('Zəhmət olmasa model seçin.');       return; }
  if (!price || price <= 0){ alert('Düzgün qiymət daxil edin.');        return; }
  if (!city)               { alert('Zəhmət olmasa region seçin.');      return; }
  if (!phone)              { alert('Əlaqə nömrəsini daxil edin.');      return; }

  const imageFiles = document.getElementById('images')?.files;
  if (!imageFiles || imageFiles.length === 0) {
    alert('Ən azı 1 şəkil əlavə edin.');
    return;
  }

  // ── 3. UI: show loading state ───────────────────────────
  const submitBtn  = document.querySelector('.ad-form-btn');
  const btnSpan    = submitBtn.querySelector('span') || submitBtn;
  const originalTxt = btnSpan.textContent;
  submitBtn.disabled = true;
  btnSpan.textContent = 'Şəkillər yüklənir…';

  try {
    // ── 4. Upload images ──────────────────────────────────
    const formData = new FormData();
    Array.from(imageFiles).forEach(file => formData.append('images', file));

    const uploadRes = await fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.message || 'Şəkil yükləmə xətası');
    }

    const uploadData = await uploadRes.json();
    const imageUrls  = uploadData.urls; // array of "/uploads/filename.jpg"

    // ── 5. Build specs object ─────────────────────────────
    const specs = {
      memory:     document.getElementById('memory')?.value      || '',
      ram:        document.getElementById('ram')?.value         || '',
      color:      document.getElementById('color')?.value       || '',
      screenSize: document.getElementById('screen_size')?.value || '',
      battery:    document.getElementById('battery')?.value     || '',
      features: {
        nfc:         document.getElementById('nfc')?.checked         || false,
        fingerprint: document.getElementById('fingerprint')?.checked || false,
        waterproof:  document.getElementById('waterproof')?.checked  || false,
        expandable:  document.getElementById('expandable')?.checked  || false,
        delivery:    document.getElementById('delivery')?.checked    || false,
      }
    };

    // Condition value
    const conditionEl = document.getElementById('condition');
    const condition = conditionEl.value ||
      conditionEl.options[conditionEl.selectedIndex]?.text?.trim() || '';

    // ── 6. Submit ad ──────────────────────────────────────
    btnSpan.textContent = 'Elan göndərilir…';

    const adPayload = {
      category,
      brand,
      modelName: model,
      price:        Number(price),
      condition,
      description:  document.getElementById('description')?.value || '',
      images:       imageUrls,
      city,
      contactPhone: phone,
      sellerType:   'personal',
      specs
    };

    const adRes = await fetch(`${API_BASE}/ads`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(adPayload)
    });

    const adData = await adRes.json();

    if (!adRes.ok) {
      throw new Error(adData.message || 'Elan yerləşdirmə xətası');
    }

    // ── 7. Success ────────────────────────────────────────
    alert('Elanınız uğurla göndərildi! Moderasiyadan keçdikdən sonra dərc ediləcək. Kabinənizə yönləndirilirsiniz…');
    window.location.href = 'cabinet.html';

  } catch (error) {
    console.error('Ad submission error:', error);
    alert('Xəta: ' + error.message);
    submitBtn.disabled = false;
    btnSpan.textContent = originalTxt;
  }
});

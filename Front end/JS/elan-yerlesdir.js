/* =========================================================
   CATEGORY → BRAND → MODEL DATA
   ========================================================= */

function isValidAzPhone(phone) {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '');
  return /^(\+994|0)?(50|51|55|70|71|77|99|10|60)\d{7}$/.test(cleaned);
}

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
    'Digər': ['Digər model'],
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
    'Digər': ['Digər model'],
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

const API_BASE = window.API_URL || window.API_BASE || localStorage.getItem('apiUrl') || 'http://localhost:5000/api';

const urlParams = typeof window !== 'undefined' && window.location && window.location.search
  ? new URLSearchParams(window.location.search)
  : new URLSearchParams('');

const editAdId = urlParams.get('edit') ? urlParams.get('edit').trim() : null;
const isEditMode = !!editAdId;
const isEdit = isEditMode;
let isEditLoading = false;
let isEditLoaded = false;
let existingAd = null;

/* =========================================================
   BRAND SELECT — update on category change
   ========================================================= */
const categorySelect = document.getElementById('category');
const brandSelect = document.getElementById('brand');
const modelSelect = document.getElementById('model');

function resetSelectOptions(sel, placeholder) {
  if (!sel) return;
  sel.innerHTML = '';
  const opt = document.createElement('option');
  opt.disabled = true;
  opt.selected = true;
  opt.value = '';
  opt.textContent = placeholder;
  sel.appendChild(opt);
}

function updateClearButtonState(selectEl) {
  if (!selectEl) return;
  const wrapper = selectEl.closest('.select-wrapper');
  if (!wrapper) return;
  const clearBtn = wrapper.querySelector('.clear-select');
  const hasValue = !!(selectEl.value && String(selectEl.value).trim() !== '');
  if (clearBtn) {
    if (hasValue) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
    }
  }
  if (hasValue) {
    wrapper.classList.add('has-value');
  } else {
    wrapper.classList.remove('has-value');
  }
}
window.updateClearButtonState = updateClearButtonState;

function handleOtherSelect(selectEl, customInputId) {
  if (!selectEl) return;
  const customInput = document.getElementById(customInputId);
  if (selectEl.value === 'other') {
    if (customInput) {
      customInput.style.display = 'block';
      customInput.required = true;
      customInput.focus();
    }
  } else {
    if (customInput) {
      customInput.style.display = 'none';
      customInput.required = false;
      customInput.value = '';
    }
  }
  updateClearButtonState(selectEl);
}
window.handleOtherSelect = handleOtherSelect;

function clearSelect(id) {
  let targetId = id;
  if (id === 'yaddas') targetId = 'memory';
  const sel = (typeof targetId === 'string')
    ? (document.getElementById(targetId) || document.getElementById(id))
    : targetId;
  if (!sel) return;
  sel.value = '';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  const actualId = sel.id;
  const custom = document.getElementById(actualId + '_custom') || (actualId === 'memory' ? document.getElementById('yaddas_custom') : null);
  if (custom) {
    custom.style.display = 'none';
    custom.required = false;
    custom.value = '';
  }
  updateClearButtonState(sel);
}
window.clearSelect = clearSelect;

if (typeof document !== 'undefined') {
  const initSelectClearButtons = () => {
    document.querySelectorAll('.select-wrapper select').forEach((sel) => {
      updateClearButtonState(sel);
      sel.addEventListener('change', () => updateClearButtonState(sel));
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSelectClearButtons);
  } else {
    initSelectClearButtons();
  }
}

function normalizeBrandKey(brand) {
  if (brand === 'Diger' || brand === 'Digər') {
    return 'Digər';
  }
  return brand;
}

function getCatalogModels(category, brand) {
  if (!category || !brand || !CATALOG[category]) return null;
  const canonicalBrand = normalizeBrandKey(brand);
  if (Array.isArray(CATALOG[category][canonicalBrand])) {
    return CATALOG[category][canonicalBrand];
  }
  if (Array.isArray(CATALOG[category][brand])) {
    return CATALOG[category][brand];
  }
  return null;
}

function populateBrands(category) {
  resetSelectOptions(brandSelect, _t.brandPlaceholder);
  resetSelectOptions(modelSelect, _t.modelPlaceholderCat);

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
  resetSelectOptions(modelSelect, _t.modelPlaceholderBrand);
  const models = getCatalogModels(category, brand);
  if (!models) return;

  models.forEach(m => {
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
resetSelectOptions(brandSelect, _t.brandPlaceholder);
resetSelectOptions(modelSelect, _t.modelPlaceholderCat);

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
    const currentModel = modelSelect.value;
    populateBrands(categorySelect.value);
    if (currentBrand) {
      const normalizedBrand = normalizeBrandKey(currentBrand) || currentBrand;
      brandSelect.value = normalizedBrand;
      populateModels(categorySelect.value, normalizedBrand);
      if (currentModel) {
        modelSelect.value = currentModel;
      }
    }
  }

  if (isEditMode) {
    applyEditModeUI();
    if (!isEditLoaded || isEditLoading) {
      setEditFormEnabled(false);
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
   DRAG & DROP + IMAGE PREVIEW (CREATE & EDIT MODES)
   ========================================================= */
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('images');
const previewGrid = document.getElementById('imagePreviewGrid');

let existingImages = [];

function getDisplayImageUrl(img) {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;
  const origin = (window.API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return origin + (img.startsWith('/') ? img : '/' + img);
}

function updateImageRequirement() {
  if (!fileInput) return;
  if (existingImages.length > 0) {
    fileInput.removeAttribute('required');
  } else if (!isEditMode) {
    fileInput.setAttribute('required', 'required');
  }
}

function renderAllImagePreviews() {
  if (!previewGrid) return;
  previewGrid.innerHTML = '';

  // 1. Existing images from edit mode
  existingImages.forEach((imgSrc, index) => {
    const container = document.createElement('div');
    container.className = 'preview-thumb-container';
    container.style.cssText = 'position:relative;display:inline-block;margin:4px;';

    const img = document.createElement('img');
    img.src = getDisplayImageUrl(imgSrc);
    img.className = 'preview-thumb';
    img.alt = `Mövcud şəkil ${index + 1}`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'preview-remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Şəkli sil';
    removeBtn.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#dc3545;color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3);';

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isEditMode && (!isEditLoaded || isEditLoading)) {
        return;
      }
      existingImages.splice(index, 1);
      renderAllImagePreviews();
      updateImageRequirement();
    });

    container.appendChild(img);
    container.appendChild(removeBtn);
    previewGrid.appendChild(container);
  });

  // 2. Newly selected files (already validated and limited)
  const files = (fileInput && fileInput.files)
    ? Array.from(fileInput.files)
    : [];

  files.forEach(file => {
    if (!file.type || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const container = document.createElement('div');
      container.className = 'preview-thumb-container';
      container.style.cssText = 'position:relative;display:inline-block;margin:4px;';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-thumb';
      img.alt = file.name;

      container.appendChild(img);
      previewGrid.appendChild(container);
    };
    reader.readAsDataURL(file);
  });

  const totalCount = existingImages.length + files.length;
  const p = fileUploadArea ? fileUploadArea.querySelector('.file-upload-content p') : null;
  if (p) {
    if (totalCount > 0) {
      if (existingImages.length > 0) {
        p.innerHTML = `<strong>${totalCount} şəkil (${existingImages.length} mövcud, ${files.length} yeni)</strong> — dəyişmək üçün yenidən seçin`;
      } else {
        p.innerHTML = `<strong>${files.length} şəkil seçildi</strong> — dəyişmək üçün yenidən seçin`;
      }
    } else {
      p.innerHTML = `<span data-translate="elan-upload-text">Şəkilləri buraya sürükleyin və ya</span> <span data-translate="elan-upload-span" style="color:#6a35b5;font-weight:600;text-decoration:underline">seçin</span>`;
    }
  }
}

let isUpdatingFileInput = false;

function validateAndSetFiles(sourceFiles) {
  if (!fileInput || isUpdatingFileInput) return;
  if (isEditMode && (!isEditLoaded || isEditLoading)) return;
  isUpdatingFileInput = true;
  try {
    const rawFiles = Array.from(sourceFiles || []);
    if (!rawFiles.length) {
      try {
        fileInput.files = new DataTransfer().files;
      } catch (e) {}
      renderAllImagePreviews();
      updateImageRequirement();
      return;
    }

    const imageFiles = rawFiles.filter(f => f.type && f.type.startsWith('image/'));
    const hasNonImages = imageFiles.length < rawFiles.length;
    const currentExistingCount = Array.isArray(existingImages) ? existingImages.length : 0;
    const remainingSlots = Math.max(0, 10 - currentExistingCount);
    const exceedsLimit = imageFiles.length > remainingSlots;
    const limitedFiles = imageFiles.slice(0, remainingSlots);

    try {
      const dt = new DataTransfer();
      limitedFiles.forEach(f => dt.items.add(f));
      fileInput.files = dt.files;
    } catch (e) {
      console.warn('DataTransfer failed to set fileInput.files:', e);
    }

    renderAllImagePreviews();
    updateImageRequirement();

    if (currentExistingCount >= 10) {
      if (hasNonImages) {
        alert('Yalnız şəkil faylları qəbul olunur. Bu elanda artıq maksimum 10 şəkil var, yeni şəkil əlavə edilə bilməz.');
      } else {
        alert('Bu elanda artıq maksimum 10 şəkil var. Yeni şəkil əlavə edə bilməzsiniz.');
      }
    } else if (hasNonImages && exceedsLimit) {
      if (currentExistingCount > 0) {
        alert(`Yalnız şəkil faylları qəbul olunur və bu elana maksimum 10 şəkil yüklənə bilər (hazırda ${currentExistingCount} mövcuddur). Yalnız daha ${remainingSlots} şəkil əlavə edə bilərsiniz. Qeyri-şəkil faylları ləğv edildi və yalnız ilk ${remainingSlots} şəkil qəbul edildi.`);
      } else {
        alert('Yalnız şəkil faylları qəbul olunur və maksimum 10 şəkil yüklənə bilər. Qeyri-şəkil faylları ləğv edildi və yalnız ilk 10 şəkil qəbul edildi.');
      }
    } else if (hasNonImages) {
      alert('Yalnız şəkil faylları qəbul olunur. Qeyri-şəkil faylları ləğv edildi.');
    } else if (exceedsLimit) {
      if (currentExistingCount > 0) {
        alert(`Maksimum 10 şəkil seçə bilərsiniz (hazırda ${currentExistingCount} mövcuddur). Siz yalnız daha ${remainingSlots} şəkil əlavə edə bilərsiniz. Yalnız ilk ${remainingSlots} şəkil qəbul edildi.`);
      } else {
        alert('Maksimum 10 şəkil seçə bilərsiniz. Yalnız ilk 10 şəkil qəbul edildi.');
      }
    }
  } finally {
    isUpdatingFileInput = false;
  }
}


if (fileInput) {
  fileInput.addEventListener('change', () => {
    if (isEditMode && (!isEditLoaded || isEditLoading)) {
      try {
        fileInput.files = new DataTransfer().files;
      } catch (e) {
        fileInput.value = '';
      }
      return;
    }
    validateAndSetFiles(fileInput.files);
  });
}

if (fileUploadArea) {
  fileUploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    if (isEditMode && (!isEditLoaded || isEditLoading)) {
      return;
    }
    fileUploadArea.classList.add('dragover');
  });
  fileUploadArea.addEventListener('dragleave', () => fileUploadArea.classList.remove('dragover'));
  fileUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    if (isEditMode && (!isEditLoaded || isEditLoading)) {
      return;
    }
    const dt = e.dataTransfer;
    if (dt && dt.files && fileInput) {
      validateAndSetFiles(dt.files);
    }
  });
}



function applyEditModeUI() {
  const heroTitle = document.querySelector('.ad-hero-title');
  if (heroTitle) {
    heroTitle.textContent = 'Elanı Redaktə Et';
    heroTitle.removeAttribute('data-translate');
  }
  const heroSubtitle = document.querySelector('.ad-hero-subtitle');
  if (heroSubtitle) {
    heroSubtitle.textContent = 'Elan məlumatlarını yeniləyin və dəyişiklikləri yadda saxlayın';
    heroSubtitle.removeAttribute('data-translate');
  }
  const heroBadge = document.querySelector('.ad-hero-badge span');
  if (heroBadge) {
    heroBadge.textContent = 'Redaktə';
    heroBadge.removeAttribute('data-translate');
  }
  if (typeof document !== 'undefined') {
    document.title = 'Elanı Redaktə Et - Mobil.az';
  }

  const submitBtn = document.querySelector('.ad-form-btn');
  if (submitBtn) {
    const btnSpan = submitBtn.querySelector('span') || submitBtn;
    btnSpan.textContent = 'Yadda Saxla';
    submitBtn.removeAttribute('data-translate');
  }

  const formCard = document.querySelector('.ad-form-card');
  if (formCard && !document.getElementById('editModeIndicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'editModeIndicator';
    indicator.style.cssText = 'background:rgba(106, 53, 181, 0.08);border:1px solid rgba(106, 53, 181, 0.25);color:var(--primary-color, #6a35b5);padding:12px 18px;border-radius:10px;margin-bottom:24px;display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;';
    indicator.innerHTML = '<i class="fas fa-edit"></i> <span>Elanı redaktə edirsiniz</span>';
    formCard.prepend(indicator);
  }
}

function decodeBasicEntities(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function setSelectValueWithFallback(selectEl, value, allowDynamicFallback = false) {
  if (!selectEl || value === undefined || value === null) return;
  const rawStr = String(value).trim();
  if (!rawStr) {
    selectEl.value = '';
    updateClearButtonState(selectEl);
    return;
  }

  const decoded = decodeBasicEntities(rawStr);

  // Check existing options for decoded or raw matches
  let matchingOpt = Array.from(selectEl.options || []).find((opt) =>
    opt.value === decoded || opt.value === rawStr || decodeBasicEntities(opt.value) === decoded
  );

  // Backward-compatible alias matching for "Diger" vs "Digər" vs "other"
  if (!matchingOpt && (decoded === 'Diger' || decoded === 'Digər' || decoded === 'other')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === 'Digər' || opt.value === 'Diger' || opt.value === 'other'
    );
  }

  // Memory aliases: below-64 vs 64-dan-az, 512+ vs 512-den-cox
  if (!matchingOpt && (decoded === 'below-64' || decoded === '64-dan-az')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === '64-dan-az' || opt.value === 'below-64'
    );
  }
  if (!matchingOpt && (decoded === '512+' || decoded === '512-den-cox')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === '512-den-cox' || opt.value === '512+'
    );
  }
  if (!matchingOpt && (decoded === '16+' || decoded === '16-dan-cox')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === '16-dan-cox' || opt.value === '16+'
    );
  }
  if (!matchingOpt && (decoded.toLowerCase() === 'yeni')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === 'Yeni' || opt.value === 'yeni'
    );
  }
  if (!matchingOpt && (decoded.toLowerCase() === 'islenmis' || decoded === 'İşlənmiş')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === 'İşlənmiş' || opt.value === 'islenmis'
    );
  }
  if (!matchingOpt && (decoded.toLowerCase() === 'temir-olunub' || decoded === 'Təmir olunub')) {
    matchingOpt = Array.from(selectEl.options || []).find((opt) =>
      opt.value === 'Təmir olunub' || opt.value === 'temir-olunub'
    );
  }

  if (matchingOpt) {
    selectEl.value = matchingOpt.value;
    updateClearButtonState(selectEl);
    return;
  }

  // If not in options, check if there's an 'other' option and custom input (e.g. custom memory/ram/battery/color)
  const customInput = document.getElementById(selectEl.id + '_custom') || (selectEl.id === 'memory' ? document.getElementById('yaddas_custom') : null);
  const otherOpt = Array.from(selectEl.options || []).find((opt) => opt.value === 'other');
  if (otherOpt && customInput) {
    selectEl.value = 'other';
    customInput.style.display = 'block';
    customInput.value = decoded;
    updateClearButtonState(selectEl);
    return;
  }

  // If dynamic fallback is explicitly allowed (e.g. custom model name), append option
  if (allowDynamicFallback) {
    const opt = document.createElement('option');
    opt.value = decoded;
    opt.textContent = decoded;
    selectEl.appendChild(opt);
    selectEl.value = decoded;
  } else {
    // For structured dropdowns, safely reset to unselected placeholder
    selectEl.value = '';
  }
  updateClearButtonState(selectEl);
}


function populateFormWithAd(ad) {
  if (!ad) return;

  // 1. Category
  if (ad.category) {
    setSelectValueWithFallback(categorySelect, ad.category);
    populateBrands(ad.category);
  }

  // 2. Brand
  if (ad.brand) {
    setSelectValueWithFallback(brandSelect, ad.brand);
    populateModels(categorySelect ? categorySelect.value : '', ad.brand);
  }

  // 3. Model
  if (ad.modelName) {
    setSelectValueWithFallback(modelSelect, ad.modelName, true);
  }


  // 4. Price
  if (ad.price !== undefined && ad.price !== null) {
    const priceEl = document.getElementById('price');
    if (priceEl) priceEl.value = ad.price;
  }

  // 5. Condition
  if (ad.condition) {
    const conditionEl = document.getElementById('condition');
    if (conditionEl) setSelectValueWithFallback(conditionEl, ad.condition);
  }

  // 6. City / Region
  if (ad.city) {
    const cityEl = document.getElementById('city');
    if (cityEl) setSelectValueWithFallback(cityEl, ad.city);
  }

  // 7. Contact Phone
  if (ad.contactPhone) {
    const phoneEl = document.getElementById('phone');
    if (phoneEl) phoneEl.value = ad.contactPhone;
  }

  // 8. Description
  if (ad.description) {
    const descEl = document.getElementById('description');
    if (descEl) {
      descEl.value = ad.description;
      const descCount = document.getElementById('descCount');
      if (descCount) descCount.textContent = descEl.value.length;
    }
  }

  // 9. Specs
  if (ad.specs) {
    const memoryEl = document.getElementById('memory');
    if (memoryEl && ad.specs.memory) setSelectValueWithFallback(memoryEl, ad.specs.memory);

    const ramEl = document.getElementById('ram');
    if (ramEl && ad.specs.ram) setSelectValueWithFallback(ramEl, ad.specs.ram);

    const colorEl = document.getElementById('color');
    if (colorEl && ad.specs.color) setSelectValueWithFallback(colorEl, ad.specs.color);

    const screenSizeEl = document.getElementById('screen_size');
    if (screenSizeEl && ad.specs.screenSize) setSelectValueWithFallback(screenSizeEl, ad.specs.screenSize);

    const batteryEl = document.getElementById('battery');
    if (batteryEl && ad.specs.battery) setSelectValueWithFallback(batteryEl, ad.specs.battery);

    if (ad.specs.features) {
      const f = ad.specs.features;
      const nfcEl = document.getElementById('nfc');
      if (nfcEl) nfcEl.checked = !!f.nfc;
      const fingerprintEl = document.getElementById('fingerprint');
      if (fingerprintEl) fingerprintEl.checked = !!f.fingerprint;
      const waterproofEl = document.getElementById('waterproof');
      if (waterproofEl) waterproofEl.checked = !!f.waterproof;
      const expandableEl = document.getElementById('expandable');
      if (expandableEl) expandableEl.checked = !!f.expandable;
      const deliveryEl = document.getElementById('delivery');
      if (deliveryEl) deliveryEl.checked = !!f.delivery;
    }
  }

  // 10. Existing Images
  existingImages = Array.isArray(ad.images) ? [...ad.images] : [];
  renderAllImagePreviews();
  updateImageRequirement();
}

function setEditFormEnabled(enabled) {
  const form = document.getElementById('adForm');
  if (!form) return;

  const controls = form.querySelectorAll('input, select, textarea, button');
  controls.forEach(ctrl => {
    if ((ctrl.classList && ctrl.classList.contains('edit-retry-btn')) || (ctrl.closest && ctrl.closest('.edit-error-banner'))) {
      return;
    }
    ctrl.disabled = !enabled;
  });

  const uploadArea = document.getElementById('fileUploadArea');
  if (uploadArea) {
    if (!enabled) {
      uploadArea.classList.add('upload-disabled');
      uploadArea.style.pointerEvents = 'none';
      uploadArea.style.opacity = '0.5';
    } else {
      uploadArea.classList.remove('upload-disabled');
      uploadArea.style.pointerEvents = '';
      uploadArea.style.opacity = '';
    }
  }

  const chips = form.querySelectorAll('.chip-toggle');
  chips.forEach(chip => {
    if (!enabled) {
      chip.style.pointerEvents = 'none';
      chip.style.opacity = '0.5';
    } else {
      chip.style.pointerEvents = '';
      chip.style.opacity = '';
    }
  });

  const removeBtns = form.querySelectorAll('.preview-remove-btn');
  removeBtns.forEach(btn => {
    btn.disabled = !enabled;
    if (!enabled) {
      btn.style.pointerEvents = 'none';
    } else {
      btn.style.pointerEvents = '';
    }
  });

  const submitBtn = document.querySelector('.ad-form-btn');
  if (submitBtn) {
    submitBtn.disabled = !enabled;
  }
}

function renderEditErrorBanner(errorMessage) {
  const formCard = document.querySelector('.ad-form-card');
  if (!formCard) return;

  const oldBanner = formCard.querySelector('.edit-error-banner');
  if (oldBanner) oldBanner.remove();

  const errorBanner = document.createElement('div');
  errorBanner.className = 'edit-error-banner';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.style.cssText = 'background:#fee2e2;color:#991b1b;border:1px solid #f87171;padding:18px 20px;border-radius:10px;margin-bottom:24px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);';

  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:15px;';

  const icon = document.createElement('i');
  icon.className = 'fas fa-exclamation-triangle';
  messageDiv.appendChild(icon);

  const textSpan = document.createElement('span');
  textSpan.textContent = errorMessage || 'Elan məlumatlarını yükləmək mümkün olmadı.';
  messageDiv.appendChild(textSpan);

  errorBanner.appendChild(messageDiv);

  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'margin-top:14px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;';

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'edit-retry-btn';
  retryBtn.style.cssText = 'background:#dc2626;color:#ffffff;border:none;border-radius:6px;padding:8px 20px;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,0.15);';

  const retryIcon = document.createElement('i');
  retryIcon.className = 'fas fa-redo-alt';
  retryBtn.appendChild(retryIcon);

  const retryText = document.createElement('span');
  retryText.textContent = 'Yenidən cəhd et';
  retryBtn.appendChild(retryText);

  retryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (isEditLoading) return;
    retryBtn.disabled = true;
    retryBtn.style.opacity = '0.7';
    retryBtn.style.cursor = 'not-allowed';
    const span = retryBtn.querySelector('span');
    if (span) span.textContent = 'Yüklənir…';
    initEditMode();
  });

  const cabinetLink = document.createElement('a');
  cabinetLink.href = 'cabinet.html';
  cabinetLink.style.cssText = 'color:#7f1d1d;font-size:13px;text-decoration:underline;font-weight:500;';
  cabinetLink.textContent = 'Şəxsi kabinetə qayıt';

  actionsDiv.appendChild(retryBtn);
  actionsDiv.appendChild(cabinetLink);
  errorBanner.appendChild(actionsDiv);

  formCard.prepend(errorBanner);
}

async function initEditMode() {
  if (!isEditMode) return;
  if (isEditLoading) return;

  applyEditModeUI();

  isEditLoading = true;
  isEditLoaded = false;
  setEditFormEnabled(false);

  const submitBtn = document.querySelector('.ad-form-btn');
  const btnSpan = submitBtn ? (submitBtn.querySelector('span') || submitBtn) : null;
  if (submitBtn) submitBtn.disabled = true;
  if (btnSpan) btnSpan.textContent = 'Elan məlumatları yüklənir…';

  const formCard = document.querySelector('.ad-form-card');
  const existingBanner = formCard ? formCard.querySelector('.edit-error-banner') : null;
  if (existingBanner) {
    const retryBtn = existingBanner.querySelector('.edit-retry-btn');
    if (retryBtn) {
      retryBtn.disabled = true;
      retryBtn.style.opacity = '0.7';
      retryBtn.style.cursor = 'not-allowed';
      const span = retryBtn.querySelector('span');
      if (span) span.textContent = 'Yüklənir…';
    }
  }

  try {
    const rawToken = window.getAuthToken ? window.getAuthToken() : (sessionStorage.getItem('token') || '');
    const token = rawToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '') || '';
    if (!token) {
      if (typeof renderEditErrorBanner === 'function') renderEditErrorBanner('Redaktə üçün hesabınıza daxil olmalısınız.');
      setTimeout(() => { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href); }, 1500);
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    let res;
    try {
      res = await fetch(`${API_BASE}/ads/${encodeURIComponent(editAdId)}`, {
        method: 'GET',
        headers
      });
    } catch (networkErr) {
      throw new Error('Serverlə əlaqə qurulmadı. Zəhmət olmasa internet bağlantınızı və ya serverin aktivliyini yoxlayın.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 400) {
        throw new Error(errData.message || 'Elan identifikatoru (ID) yalnışdır.');
      } else if (res.status === 401) {
        throw new Error(errData.message || 'Bu əməliyyat üçün hesabınıza daxil olmalısınız.');
      } else if (res.status === 403) {
        throw new Error(errData.message || 'Bu elana düzəliş etmək hüququnuz yoxdur.');
      } else if (res.status === 404) {
        throw new Error(errData.message || 'Elan tapılmadı və ya silinib.');
      } else {
        throw new Error(errData.message || 'Elanı yükləmək mümkün olmadı.');
      }
    }

    const ad = await res.json();
    if (!ad || !ad._id) {
      throw new Error('Elan məlumatları tapılmadı.');
    }

    existingAd = ad;
    if (existingAd && existingAd.sellerType === 'store') {
      const existingStoreId = existingAd.store?._id || existingAd.store || null;
      if (existingStoreId) {
        const optDivEdit = document.getElementById('storePostOption');
        if (optDivEdit) optDivEdit.style.display = 'block';
        const checkBox = document.getElementById('postAsStore');
        if (checkBox) checkBox.checked = true;
        const nameEl = document.getElementById('myStoreName');
        const sName = existingAd.store?.name || existingAd.store?.storeName || '';
        if (nameEl && sName) nameEl.textContent = sName;
      }
    }

    if (formCard) {
      const banner = formCard.querySelector('.edit-error-banner');
      if (banner) banner.remove();
    }

    populateFormWithAd(ad);
    isEditLoading = false;
    isEditLoaded = true;
    setEditFormEnabled(true);
    if (submitBtn) submitBtn.disabled = false;
    if (btnSpan) btnSpan.textContent = 'Yadda Saxla';

  } catch (err) {
    console.error('Error loading ad for edit:', err);
    isEditLoading = false;
    isEditLoaded = false;
    existingImages = [];
    renderAllImagePreviews();
    updateImageRequirement();
    setEditFormEnabled(false);

    if (submitBtn) submitBtn.disabled = true;
    if (btnSpan) btnSpan.textContent = 'Xəta baş verdi';

    renderEditErrorBanner(err.message || 'Elan məlumatları yüklənə bilmədi.');
  }
}

async function initStoreOption(){
  const storeOptionDiv = document.getElementById('storePostOption');
  const checkBox = document.getElementById('postAsStore');
  const nameSpan = document.getElementById('myStoreName');
  let storeId = null;
  let storeName = '';
  // 1. Try localStorage fast path (if future backend adds it)
  try {
    const cu = JSON.parse(localStorage.getItem('mobilaz_current_user')||'{}') || JSON.parse(localStorage.getItem('user')||'{}') || {};
    storeId = cu.storeId || cu.store?._id || cu.store || cu.shopId || cu.shop?._id || null;
    storeName = cu.storeName || cu.store?.name || '';
  } catch(e){}
  // 2. REAL source - fetch from API
  try {
    const rawToken = window.getAuthToken? window.getAuthToken() : (sessionStorage.getItem('token')||'');
    const token = rawToken || localStorage.getItem('token') || '';
    if (token) {
      const res = await fetch(`${window.API_URL||'http://localhost:5000/api'}/stores/my`, { headers: { 'Authorization': `Bearer ${token}` } });
      // try alternative endpoints if 404
      let data = null;
      if (res.ok) data = await res.json();
      else {
        const res2 = await fetch(`${window.API_URL||'http://localhost:5000/api'}/stores/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res2.ok) data = await res2.json();
      }
      // data can be {store: {...}} or {...} or [...]
      const storeObj = data?.store || data?.data || (Array.isArray(data)? data[0] : data) || null;
      if (storeObj && (storeObj._id || storeObj.id)) {
        storeId = storeObj._id || storeObj.id;
        storeName = storeObj.name || storeName;
      }
    }
  } catch(e){ console.warn('store fetch failed', e.message); }
  // 3. Show UI
  if (storeId && storeOptionDiv) {
    storeOptionDiv.style.display = 'block';
    if (nameSpan && storeName) nameSpan.textContent = storeName;
    if (checkBox) checkBox.checked = true;
    // save for submit handler
    window._mobilaz_myStoreId = storeId;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await initStoreOption();
      initEditMode();
    });
  } else {
    (async () => {
      await initStoreOption();
      initEditMode();
    })();
  }
}

/* =========================================================
   FORM SUBMIT — CREATE (POST) / EDIT (PUT)
   ========================================================= */

const adFormEl = document.getElementById('adForm');
if (adFormEl) {
  adFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (isEditMode && (!isEditLoaded || isEditLoading)) {
      alert('Elan məlumatları yüklənməyib və ya xəta baş verib. Redaktə rejimində yeni elan yaradıla bilməz.');
      return;
    }

    // ── 1. Auth guard ───────────────────────────────────────
    const rawToken = window.getAuthToken
      ? window.getAuthToken()
      : (sessionStorage.getItem('token') || '');
    const token = rawToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '') || '';

    if (!token) {
      alert('Elan yerləşdirmək üçün hesabınıza daxil olun.');
      const search = (window.location && window.location.search) ? window.location.search : '';
      const target = search ? `elan-yerlesdir.html${search}` : 'elan-yerlesdir.html';
      window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
      return;
    }

    // ── 2. Basic validation ─────────────────────────────────
    const imgInput = document.getElementById('imageInput') || document.getElementById('images') || fileInput;
    const files = imgInput?.files;
    if (files && files.length > 10) {
      alert('Maksimum 10 şəkil yükləyə bilərsiniz.');
      return;
    }

    const category    = categorySelect ? categorySelect.value : '';
    const brand       = brandSelect ? brandSelect.value : '';
    const model       = modelSelect ? modelSelect.value : '';
    const priceRaw    = document.getElementById('price')?.value || '';
    const priceNum    = Number(priceRaw);
    if (!priceRaw || Number.isNaN(priceNum) || priceNum <= 0) {
      alert('Düzgün qiymət daxil edin.');
      return;
    }
    const price       = priceNum;
    const phone       = document.getElementById('phone') ? document.getElementById('phone').value : '';
    const cityEl      = document.getElementById('city');
    const city        = cityEl ? cityEl.value : '';

    if (!category)           { alert('Zəhmət olmasa kateqoriya seçin.');  return; }
    if (!brand)              { alert('Zəhmət olmasa marka seçin.');       return; }
    if (!model)              { alert('Zəhmət olmasa model seçin.');       return; }
    if (!city)               { alert('Zəhmət olmasa region seçin.');      return; }
    if (!phone)              { alert('Əlaqə nömrəsini daxil edin.');      return; }
    if (!isValidAzPhone(phone)) {
      alert('Düzgün əlaqə nömrəsi daxil edin (məs: +994 50 123 45 67).');
      return;
    }

    const currentExistingCount = (isEditMode && Array.isArray(existingImages)) ? existingImages.length : 0;
    const newFileCount = files ? files.length : 0;
    const totalImageCount = newFileCount + currentExistingCount;

    if (totalImageCount < 1) {
      alert('Ən az 1 şəkil seçin.');
      return;
    }
    if (newFileCount > 10 || totalImageCount > 10) {
      alert('Maksimum 10 şəkil yükləyə bilərsiniz.');
      return;
    }

    const rawImageFiles = (files && files.length) ? Array.from(files) : [];
    const validImageFiles = rawImageFiles.filter(f => f.type && f.type.startsWith('image/'));
    const hasNewImages = validImageFiles.length > 0;
    const hasExistingImages = currentExistingCount > 0;

    const oversizedFile = validImageFiles.find(f => f.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      alert(`"${oversizedFile.name}" faylının ölçüsü 5MB-dən böyükdür. Zəhmət olmasa hər biri 5MB-dən kiçik şəkillər seçin.`);
      return;
    }

    // ── 3. UI: show loading state ───────────────────────────
    const submitBtn  = document.querySelector('.ad-form-btn');
    const btnSpan    = submitBtn ? (submitBtn.querySelector('span') || submitBtn) : null;
    const originalTxt = isEditMode ? 'Yadda Saxla' : (btnSpan ? btnSpan.textContent : 'Elan yerləşdir');
    if (submitBtn) submitBtn.disabled = true;
    if (btnSpan) {
      btnSpan.textContent = hasNewImages
        ? 'Şəkillər yüklənir…'
        : (isEditMode ? 'Məlumatlar yenilənir…' : 'Elan göndərilir…');
    }

    try {
      // ── 4. Upload images if new ones selected ──────────────
      let finalImageUrls = [...existingImages];

      if (hasNewImages) {
        const formData = new FormData();
        validImageFiles.forEach(file => formData.append('images', file));

        const uploadRes = await fetch(`${API_BASE}/upload/multiple`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.message || 'Şəkil yükləmə xətası');
        }

        const uploadData = await uploadRes.json();
        const uploadedUrls = uploadData.urls || [];
        finalImageUrls = finalImageUrls.concat(uploadedUrls);
      }

      if (finalImageUrls.length > 10) {
        alert('Maksimum 10 şəkil yükləyə bilərsiniz.');
        if (submitBtn) submitBtn.disabled = false;
        if (btnSpan) btnSpan.textContent = originalTxt;
        return;
      }


      // ── 5. Build specs object ─────────────────────────────
      function getSpecValue(selectId, customInputId) {
        const select = document.getElementById(selectId);
        if (!select) return null;
        const val = select.value ? select.value.trim() : '';
        if (val === 'other') {
          const custom = document.getElementById(customInputId || (selectId + '_custom'));
          return (custom && custom.value.trim()) ? custom.value.trim() : null;
        }
        return val || null;
      }

      function getConditionValue() {
        const condEl = document.getElementById('condition');
        if (!condEl) return null;
        const val = condEl.value ? condEl.value.trim() : '';
        if (val === 'other') {
          const custom = document.getElementById('condition_custom');
          return (custom && custom.value.trim()) ? custom.value.trim() : null;
        }
        return val || null;
      }

      const conditionVal = getConditionValue();
      const specs = {
        memory:     getSpecValue('memory', 'memory_custom'),
        ram:        getSpecValue('ram', 'ram_custom'),
        color:      getSpecValue('color', 'color_custom'),
        screenSize: getSpecValue('screen_size', 'screen_size_custom'),
        battery:    getSpecValue('battery', 'battery_custom'),
        features: {
          nfc:         document.getElementById('nfc')?.checked         || false,
          fingerprint: document.getElementById('fingerprint')?.checked || false,
          waterproof:  document.getElementById('waterproof')?.checked  || false,
          expandable:  document.getElementById('expandable')?.checked  || false,
          delivery:    document.getElementById('delivery')?.checked    || false,
        }
      };

      // ── 6. Submit ad (PUT for edit mode, POST for create) ──
      const cuRaw = localStorage.getItem('mobilaz_current_user') || localStorage.getItem('user') || '{}';
      let cu = {};
      try { cu = JSON.parse(cuRaw); } catch(e) {}
      const storeIdFromInit = window._mobilaz_myStoreId || null;
      const storeId = storeIdFromInit || cu.storeId || cu.store?._id || cu.store || cu.shopId || cu.shop?._id || null;
      const storeName = cu.storeName || cu.store?.name || cu.shopName || cu.shop?.name || 'Mağazam';
      const optDiv = document.getElementById('storePostOption');
      const checkBox = document.getElementById('postAsStore');
      const nameEl = document.getElementById('myStoreName');
      if (storeId && optDiv) {
        optDiv.style.display = 'block';
        if (nameEl) nameEl.textContent = storeName;
      }
      const isStore = !!(storeId && (checkBox ? checkBox.checked : true));

      if (isEditMode) {
        // In payload for edit, preserve if user was store:
        if (isEdit && existingAd?.sellerType === 'store' && !isStore) {
          // if user unchecks store option on edit, keep personal - allow change
        }
        if (btnSpan) btnSpan.textContent = 'Məlumatlar yenilənir…';

        const updatePayload = {
          category,
          brand,
          modelName: model,
          price:        Number(price),
          condition:    conditionVal,
          description:  document.getElementById('description')?.value || '',
          images:       finalImageUrls,
          city,
          contactPhone: phone,
          yaddas:       specs.memory,
          ram:          specs.ram,
          specs
        };

        const updateRes = await fetch(`${API_BASE}/ads/${encodeURIComponent(editAdId)}`, {
          method:  'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });

        const updateData = await updateRes.json().catch(() => ({}));

        if (!updateRes.ok) {
          throw new Error(updateData.message || 'Elan yenilənmə xətası');
        }

        alert('Elanınız uğurla yeniləndi! Kabinənizə yönləndirilirsiniz…');
        window.location.href = 'cabinet.html';

      } else {
        if (btnSpan) btnSpan.textContent = 'Elan göndərilir…';

        const adPayload = {
          category,
          brand,
          modelName: model,
          price:        Number(price),
          condition:    conditionVal,
          description:  document.getElementById('description')?.value || '',
          images:       finalImageUrls,
          city,
          contactPhone: phone,
          sellerType:   isStore ? 'store' : 'personal',
          ...(isStore && storeId ? { store: storeId } : {}),
          yaddas:       specs.memory,
          ram:          specs.ram,
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

        const adData = await adRes.json().catch(() => ({}));

        if (!adRes.ok) {
          throw new Error(adData.message || 'Elan yerləşdirmə xətası');
        }

        alert('Elanınız uğurla göndərildi! Moderasiyadan keçdikdən sonra dərc ediləcək. Kabinənizə yönləndirilirsiniz…');
        window.location.href = 'cabinet.html';
      }

    } catch (error) {
      console.error('Ad submission error:', error);
      alert('Xəta: ' + error.message);
      if (submitBtn) submitBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = originalTxt;
    }
  });
}

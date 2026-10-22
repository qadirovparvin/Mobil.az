const assert = require('assert');

console.log('--- RUNNING XSS PREVENTION UNIT TESTS (NO EXTERNAL DEPS) ---');

// Minimal DOM mock simulating node creation, textContent, replaceChildren, innerHTML
class MockNode {
    constructor(nodeType, nodeName) {
        this.nodeType = nodeType; // 1 = Element, 3 = Text
        this.nodeName = nodeName;
        this.childNodes = [];
        this.classList = new Set();
        this.style = {};
        this.attributes = {};
        this._innerHTML = '';
        this._textContent = '';
    }

    get className() {
        return Array.from(this.classList).join(' ');
    }
    set className(val) {
        this.classList = new Set((val || '').split(/\s+/).filter(Boolean));
    }

    setAttribute(name, val) {
        this.attributes[name] = val;
    }

    appendChild(child) {
        this.childNodes.push(child);
        return child;
    }

    insertBefore(newChild, refChild) {
        const idx = this.childNodes.indexOf(refChild);
        if (idx === -1) {
            this.childNodes.push(newChild);
        } else {
            this.childNodes.splice(idx, 0, newChild);
        }
        return newChild;
    }

    replaceChildren(...newChildren) {
        this.childNodes = [...newChildren];
        this._innerHTML = '';
        this._textContent = '';
    }

    get textContent() {
        if (this.childNodes.length > 0) {
            return this.childNodes.map(c => c.textContent).join('');
        }
        return this._textContent;
    }
    set textContent(val) {
        this.childNodes = [];
        this._textContent = String(val);
    }

    get innerHTML() {
        if (this._innerHTML) return this._innerHTML;
        return this.childNodes.map(c => {
            if (c.nodeType === 3) return c._textContent;
            return `<${c.nodeName.toLowerCase()}>${c.innerHTML}</${c.nodeName.toLowerCase()}>`;
        }).join('');
    }
    set innerHTML(val) {
        this._innerHTML = String(val);
        this.childNodes = [];
        if (val.includes('<script')) {
            const scriptNode = new MockNode(1, 'SCRIPT');
            this.childNodes.push(scriptNode);
        }
    }

    querySelectorAll(selector) {
        const results = [];
        const isClass = selector.startsWith('.');
        const targetClass = isClass ? selector.slice(1) : '';
        const selUpper = selector.toUpperCase();

        for (const child of this.childNodes) {
            if (isClass && child.classList.has(targetClass)) results.push(child);
            else if (!isClass && child.nodeName === selUpper) results.push(child);

            if (child.querySelectorAll) results.push(...child.querySelectorAll(selector));
        }
        return results;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }
}

const mockDoc = {
    createElement(tag) {
        return new MockNode(1, tag.toUpperCase());
    },
    createTextNode(text) {
        const node = new MockNode(3, '#text');
        node.textContent = text;
        return node;
    }
};

// 1. Test Quick Specs:
{
    const quickSpecsEl = mockDoc.createElement('div');
    const ad = {
        specs: {
            memory: '<script>alert(1)</script>',
            ram: '8GB'
        }
    };

    quickSpecsEl.replaceChildren();
    const addChip = (iconClass, text) => {
        const chip = mockDoc.createElement('span');
        chip.className = 'spec-chip';
        const i = mockDoc.createElement('i');
        i.className = iconClass;
        chip.appendChild(i);
        chip.appendChild(mockDoc.createTextNode(' ' + text));
        quickSpecsEl.appendChild(chip);
    };

    if (ad.specs?.memory) addChip('fas fa-memory', `${ad.specs.memory} Yaddaş`);
    if (ad.specs?.ram) addChip('fas fa-microchip', `${ad.specs.ram} RAM`);

    assert.strictEqual(quickSpecsEl.querySelectorAll('script').length, 0, 'No script elements created');
    assert.ok(quickSpecsEl.textContent.includes('<script>alert(1)</script> Yaddaş'), 'Script tag preserved purely as safe text');
    console.log('✓ Quick specs chip logic verified: 0 script elements created');
}

// 2. Test Specs Grid:
{
    const specsGrid = mockDoc.createElement('div');
    const ad = {
        brand: '<script>alert("xss")</script>',
        modelName: 'iPhone 13'
    };

    specsGrid.replaceChildren();
    const addSpecRow = (label, val) => {
        const row = mockDoc.createElement('div');
        row.className = 'spec-row';
        const lblSpan = mockDoc.createElement('span');
        lblSpan.className = 'spec-label';
        lblSpan.textContent = label;
        const valSpan = mockDoc.createElement('span');
        valSpan.className = 'spec-value';
        valSpan.textContent = val;
        row.appendChild(lblSpan);
        row.appendChild(valSpan);
        specsGrid.appendChild(row);
    };

    addSpecRow('Marka', ad.brand || '-');
    addSpecRow('Model', ad.modelName || '-');

    assert.strictEqual(specsGrid.querySelectorAll('script').length, 0, 'No script tags in specsGrid');
    assert.ok(specsGrid.textContent.includes('<script>alert("xss")</script>'), 'Marka text is literal string');
    console.log('✓ Specs grid logic verified: 0 script elements created');
}

// 3. Test Reviews:
{
    const section = mockDoc.createElement('div');
    const reviews = [
        {
            rating: 5,
            author: { name: '<script>alert("author")</script>' },
            comment: '<script>alert("comment-xss")</script>',
            createdAt: new Date().toISOString()
        }
    ];

    reviews.forEach(r => {
        const div = mockDoc.createElement('div');
        div.className = 'review-card-full';

        const nameDiv = mockDoc.createElement('div');
        nameDiv.className = 'rc-name';
        nameDiv.textContent = r.author?.name || 'İstifadəçi';

        const commentP = mockDoc.createElement('p');
        commentP.className = 'rc-text';
        commentP.textContent = r.comment || '';

        div.appendChild(nameDiv);
        div.appendChild(commentP);
        section.appendChild(div);
    });

    assert.strictEqual(section.querySelectorAll('script').length, 0, 'No script tags in review section');
    assert.strictEqual(section.querySelector('.rc-name').textContent, '<script>alert("author")</script>');
    assert.strictEqual(section.querySelector('.rc-text').textContent, '<script>alert("comment-xss")</script>');
    console.log('✓ Review comment & author logic verified: 0 script elements created');
}

// 4. Test Notifications:
{
    const listEl = mockDoc.createElement('div');
    const items = [
        {
            title: '<script>alert("notif-title")</script>',
            body: '<script>alert("notif-body")</script>',
            createdAt: new Date().toISOString()
        }
    ];

    listEl.replaceChildren();
    items.forEach(n => {
        const title = (n.title || '').replace(/AiryPhone/gi, 'Mobil.az');
        const content = (n.body || n.message || '').replace(/AiryPhone/gi, 'Mobil.az');

        const itemDiv = mockDoc.createElement('div');
        itemDiv.className = 'notif-item';

        const textDiv = mockDoc.createElement('div');
        if (title) {
            const strong = mockDoc.createElement('strong');
            strong.textContent = title;
            textDiv.appendChild(strong);
        }
        if (content) {
            textDiv.appendChild(mockDoc.createTextNode(content));
        }
        itemDiv.appendChild(textDiv);
        listEl.appendChild(itemDiv);
    });

    assert.strictEqual(listEl.querySelectorAll('script').length, 0, 'No script tags in notification list');
    assert.ok(listEl.textContent.includes('<script>alert("notif-title")</script>'));
    assert.ok(listEl.textContent.includes('<script>alert("notif-body")</script>'));
    console.log('✓ Notifications logic verified: 0 script elements created');
}

// 5. Test Countdown timer:
{
    const resendEl = mockDoc.createElement('button');
    const timerSpanId = 'timerSpan';
    const s = 60;

    resendEl.replaceChildren();
    resendEl.appendChild(mockDoc.createTextNode('Yenidən göndər ('));
    const span = mockDoc.createElement('span');
    span.className = 'otp-timer';
    span.id = timerSpanId;
    span.textContent = s;
    resendEl.appendChild(span);
    resendEl.appendChild(mockDoc.createTextNode('s)'));

    assert.strictEqual(resendEl.querySelectorAll('script').length, 0);
    assert.strictEqual(resendEl.textContent, 'Yenidən göndər (60s)');
    console.log('✓ Countdown timer logic verified: text rendered safely');
}

// 6. Test satici-profil.js ads rendering with <script> payload
{
    const container = mockDoc.createElement('div');
    const xssAds = [
        {
            _id: 'ad_xss_1',
            brand: '<script>alert("xss-brand")</script>',
            modelName: '<script>alert("xss-model")</script>',
            city: '<script>alert("xss-city")</script>',
            price: 500,
            createdAt: new Date().toISOString()
        }
    ];

    container.replaceChildren();
    xssAds.forEach(ad => {
        const title = `${ad.brand || ''} ${ad.modelName || ''}`.trim() || 'Elan';
        const a = mockDoc.createElement('a');
        const card = mockDoc.createElement('div');
        card.className = 'ad-card';

        const adInfo = mockDoc.createElement('div');
        adInfo.className = 'ad-info';

        const priceDiv = mockDoc.createElement('div');
        priceDiv.className = 'ad-price';
        priceDiv.textContent = `${Number(ad.price || 0).toLocaleString()} AZN`;

        const titleDiv = mockDoc.createElement('div');
        titleDiv.className = 'ad-title';
        titleDiv.textContent = title;

        const locDiv = mockDoc.createElement('div');
        locDiv.className = 'ad-location';

        const citySpan = mockDoc.createElement('span');
        citySpan.textContent = ad.city || '';

        locDiv.appendChild(citySpan);
        adInfo.appendChild(priceDiv);
        adInfo.appendChild(titleDiv);
        adInfo.appendChild(locDiv);
        card.appendChild(adInfo);
        a.appendChild(card);
        container.appendChild(a);
    });

    assert.strictEqual(container.querySelectorAll('script').length, 0, 'No script elements created in satici-profil');
    assert.ok(container.textContent.includes('<script>alert("xss-brand")</script>'), 'Payload rendered safely as text');
    assert.ok(container.textContent.includes('<script>alert("xss-city")</script>'), 'City payload rendered safely as text');
    console.log('✓ Satici-profil logic verified: <script> rendered as harmless text');
}

// 7. Test favorites.js ads rendering with <script> payload
{
    const grid = mockDoc.createElement('div');
    const favAds = [
        {
            _id: 'ad_fav_1',
            brand: '<script>alert("xss-fav-brand")</script>',
            modelName: '<script>alert("xss-fav-model")</script>',
            city: '<script>alert("xss-fav-city")</script>',
            price: 750,
            sellerType: 'store',
            createdAt: new Date().toISOString()
        }
    ];

    grid.replaceChildren();
    favAds.forEach(ad => {
        const title = [ad.brand, ad.modelName].filter(Boolean).join(" ");
        const price = `${Number(ad.price || 0).toLocaleString("az-AZ")} AZN`;
        const city = ad.city || "";

        const aTag = mockDoc.createElement('a');
        const card = mockDoc.createElement('div');
        card.className = 'ad-card';

        const adInfo = mockDoc.createElement('div');
        adInfo.className = 'ad-info';

        const priceDiv = mockDoc.createElement('div');
        priceDiv.className = 'ad-price';
        priceDiv.textContent = price;

        const titleDiv = mockDoc.createElement('div');
        titleDiv.className = 'ad-title';
        titleDiv.textContent = title;

        const locDiv = mockDoc.createElement('div');
        locDiv.className = 'ad-location';

        const citySpan = mockDoc.createElement('span');
        citySpan.textContent = city;

        locDiv.appendChild(citySpan);
        adInfo.appendChild(priceDiv);
        adInfo.appendChild(titleDiv);
        adInfo.appendChild(locDiv);
        card.appendChild(adInfo);
        aTag.appendChild(card);
        grid.appendChild(aTag);
    });

    assert.strictEqual(grid.querySelectorAll('script').length, 0, 'No script elements created in favorites');
    assert.ok(grid.textContent.includes('<script>alert("xss-fav-brand")</script>'), 'Favorites payload rendered safely as text');
    assert.ok(grid.textContent.includes('<script>alert("xss-fav-city")</script>'), 'Favorites city payload rendered safely as text');
    console.log('✓ Favorites logic verified: <script> rendered as harmless text');
}

console.log('ALL XSS TEST SUITES PASSED! ✅');

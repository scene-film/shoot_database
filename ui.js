// ===========================
// ui.js - UI管理
// ===========================

class LokeNaviUI {
    constructor() {
        this.elements = {};
    }

    init() {
        this.elements = {
            sidebarBtns: document.querySelectorAll('.sidebar-btn'),
            pages: document.querySelectorAll('.page'),
            setupNotice: document.getElementById('setupNotice'),
            setupNoticeBtn: document.getElementById('setupNoticeBtn'),
            toast: document.getElementById('toast'),
            
            // 弁当
            bentoPage: document.getElementById('bentoPage'),
            bentoCategoryChips: document.getElementById('bentoCategoryChips'),
            bentoAreaFilter: document.getElementById('bentoAreaFilter'),
            bentoPriceFilter: document.getElementById('bentoPriceFilter'),
            bentoSearchInput: document.getElementById('bentoSearchInput'),
            bentoGrid: document.getElementById('bentoGrid'),
            bentoCount: document.getElementById('bentoCount'),
            bentoNoResults: document.getElementById('bentoNoResults'),
            bentoLoading: document.getElementById('bentoLoading'),
            openBentoModal: document.getElementById('openBentoModal'),
            bentoModalOverlay: document.getElementById('bentoModalOverlay'),
            closeBentoModal: document.getElementById('closeBentoModal'),
            bentoForm: document.getElementById('bentoForm'),
            bentoUrl: document.getElementById('bentoUrl'),
            bentoFetchStatus: document.getElementById('bentoFetchStatus'),
            bentoImagePreview: document.getElementById('bentoImagePreview'),
            bentoName: document.getElementById('bentoName'),
            bentoImage: document.getElementById('bentoImage'),
            bentoCategoryCheckboxes: document.getElementById('bentoCategoryCheckboxes'),
            bentoAreaCheckboxes: document.getElementById('bentoAreaCheckboxes'),
            bentoPrice: document.getElementById('bentoPrice'),
            bentoDescription: document.getElementById('bentoDescription'),
            bentoSubmit: document.getElementById('bentoSubmit'),
            bentoEditOverlay: document.getElementById('bentoEditOverlay'),
            closeBentoEdit: document.getElementById('closeBentoEdit'),
            bentoEditForm: document.getElementById('bentoEditForm'),
            bentoEditId: document.getElementById('bentoEditId'),
            bentoEditUrl: document.getElementById('bentoEditUrl'),
            bentoEditName: document.getElementById('bentoEditName'),
            bentoEditCategoryCheckboxes: document.getElementById('bentoEditCategoryCheckboxes'),
            bentoEditAreaCheckboxes: document.getElementById('bentoEditAreaCheckboxes'),
            bentoEditPrice: document.getElementById('bentoEditPrice'),
            bentoEditImage: document.getElementById('bentoEditImage'),
            bentoEditDescription: document.getElementById('bentoEditDescription'),
            cancelBentoEdit: document.getElementById('cancelBentoEdit'),
            saveBentoEdit: document.getElementById('saveBentoEdit'),
            
            // ロケ地
            locationPage: document.getElementById('locationPage'),
            locationCategoryChips: document.getElementById('locationCategoryChips'),
            locationAreaFilter: document.getElementById('locationAreaFilter'),
            locationSearchInput: document.getElementById('locationSearchInput'),
            locationGrid: document.getElementById('locationGrid'),
            locationCount: document.getElementById('locationCount'),
            locationNoResults: document.getElementById('locationNoResults'),
            locationLoading: document.getElementById('locationLoading'),
            openLocationModal: document.getElementById('openLocationModal'),
            locationModalOverlay: document.getElementById('locationModalOverlay'),
            closeLocationModal: document.getElementById('closeLocationModal'),
            locationForm: document.getElementById('locationForm'),
            locationUrl: document.getElementById('locationUrl'),
            locationFetchStatus: document.getElementById('locationFetchStatus'),
            locationImagePreview: document.getElementById('locationImagePreview'),
            locationName: document.getElementById('locationName'),
            locationImage: document.getElementById('locationImage'),
            locationCategoryCheckboxes: document.getElementById('locationCategoryCheckboxes'),
            locationAreaCheckboxes: document.getElementById('locationAreaCheckboxes'),
            locationAddress: document.getElementById('locationAddress'),
            locationDescription: document.getElementById('locationDescription'),
            locationSubmit: document.getElementById('locationSubmit'),
            locationEditOverlay: document.getElementById('locationEditOverlay'),
            closeLocationEdit: document.getElementById('closeLocationEdit'),
            locationEditForm: document.getElementById('locationEditForm'),
            locationEditId: document.getElementById('locationEditId'),
            locationEditUrl: document.getElementById('locationEditUrl'),
            locationEditName: document.getElementById('locationEditName'),
            locationEditCategoryCheckboxes: document.getElementById('locationEditCategoryCheckboxes'),
            locationEditAreaCheckboxes: document.getElementById('locationEditAreaCheckboxes'),
            locationEditAddress: document.getElementById('locationEditAddress'),
            locationEditImage: document.getElementById('locationEditImage'),
            locationEditDescription: document.getElementById('locationEditDescription'),
            cancelLocationEdit: document.getElementById('cancelLocationEdit'),
            saveLocationEdit: document.getElementById('saveLocationEdit'),
            
            // 設定
            openSettings: document.getElementById('openSettings'),
            settingsOverlay: document.getElementById('settingsOverlay'),
            closeSettings: document.getElementById('closeSettings'),
            settingsStatus: document.getElementById('settingsStatus'),
            gasUrl: document.getElementById('gasUrl'),
            testConnection: document.getElementById('testConnection'),
            runSetup: document.getElementById('runSetup'),
            copyGasCode: document.getElementById('copyGasCode'),
            resetSettings: document.getElementById('resetSettings'),
            newBentoCategoryName: document.getElementById('newBentoCategoryName'),
            addBentoCategoryBtn: document.getElementById('addBentoCategoryBtn'),
            bentoCategoryList: document.getElementById('bentoCategoryList'),
            newBentoAreaName: document.getElementById('newBentoAreaName'),
            addBentoAreaBtn: document.getElementById('addBentoAreaBtn'),
            bentoAreaList: document.getElementById('bentoAreaList'),
            newLocationCategoryName: document.getElementById('newLocationCategoryName'),
            addLocationCategoryBtn: document.getElementById('addLocationCategoryBtn'),
            locationCategoryList: document.getElementById('locationCategoryList'),
            newLocationAreaName: document.getElementById('newLocationAreaName'),
            addLocationAreaBtn: document.getElementById('addLocationAreaBtn'),
            locationAreaList: document.getElementById('locationAreaList')
        };
    }

    switchPage(pageName) {
        this.elements.sidebarBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageName));
        this.elements.pages.forEach(page => page.classList.toggle('active', page.id === pageName + 'Page'));
    }

    updateBentoCategoryChips() {
        this.elements.bentoCategoryChips.innerHTML = Object.entries(BENTO_CATEGORIES).map(([id, name]) => 
            `<button class="chip ${id === 'all' ? 'active' : ''}" data-category="${id}">${this.esc(name)}</button>`
        ).join('');
    }

    updateBentoAreaSelect() {
        this.elements.bentoAreaFilter.innerHTML = Object.entries(BENTO_AREAS).map(([id, name]) => 
            `<option value="${id}">${name}</option>`
        ).join('');
    }

    updateBentoFormCheckboxes() {
        const cats = config.getBentoCategoriesWithoutAll();
        const areas = config.getBentoAreasWithoutAll();
        this.elements.bentoCategoryCheckboxes.innerHTML = Object.entries(cats).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="category" value="${id}"><span>${this.esc(name)}</span></label>`
        ).join('');
        this.elements.bentoAreaCheckboxes.innerHTML = Object.entries(areas).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="area" value="${id}"><span>${this.esc(name)}</span></label>`
        ).join('');
    }

    updateLocationCategoryChips() {
        this.elements.locationCategoryChips.innerHTML = Object.entries(LOCATION_CATEGORIES).map(([id, name]) => 
            `<button class="chip ${id === 'all' ? 'active' : ''}" data-category="${id}">${this.esc(name)}</button>`
        ).join('');
    }

    updateLocationAreaSelect() {
        this.elements.locationAreaFilter.innerHTML = Object.entries(LOCATION_AREAS).map(([id, name]) => 
            `<option value="${id}">${name}</option>`
        ).join('');
    }

    updateLocationFormCheckboxes() {
        const cats = config.getLocationCategoriesWithoutAll();
        const areas = config.getLocationAreasWithoutAll();
        this.elements.locationCategoryCheckboxes.innerHTML = Object.entries(cats).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="category" value="${id}"><span>${this.esc(name)}</span></label>`
        ).join('');
        this.elements.locationAreaCheckboxes.innerHTML = Object.entries(areas).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="area" value="${id}"><span>${this.esc(name)}</span></label>`
        ).join('');
    }

    renderBentoShops(shops) {
        this.elements.bentoCount.textContent = shops.length;
        if (shops.length === 0) {
            this.elements.bentoGrid.innerHTML = '';
            this.elements.bentoNoResults.style.display = 'block';
            return;
        }
        this.elements.bentoNoResults.style.display = 'none';
        this.elements.bentoGrid.innerHTML = shops.map(s => this._card(s, 'bento', BENTO_CATEGORIES, BENTO_AREAS)).join('');
    }

    renderLocations(locations) {
        this.elements.locationCount.textContent = locations.length;
        if (locations.length === 0) {
            this.elements.locationGrid.innerHTML = '';
            this.elements.locationNoResults.style.display = 'block';
            return;
        }
        this.elements.locationNoResults.style.display = 'none';
        this.elements.locationGrid.innerHTML = locations.map(l => this._card(l, 'location', LOCATION_CATEGORIES, LOCATION_AREAS)).join('');
    }

    _card(item, type, catMap, areaMap) {
        const cats = item.category ? item.category.split(',').map(c => c.trim()) : [];
        const catLabels = cats.map(c => catMap[c] || c).join(', ');
        const areas = item.area ? item.area.split(',').map(a => a.trim()) : [];
        const areaLabels = areas.map(a => areaMap[a] || a).join(', ');
        const meta2 = type === 'bento' ? (PRICE_RANGES[item.price] || item.price) : (item.address || '');
        const ph = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23f0f0f0' width='400' height='200'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
        
        return `<article class="item-card" data-id="${item.id}" data-type="${type}">
            <div class="item-card-actions">
                <button class="item-edit-btn" data-id="${item.id}" data-type="${type}" title="編集">✎</button>
                <button class="item-delete-btn" data-id="${item.id}" data-type="${type}" title="削除">×</button>
            </div>
            <div class="item-card-content" ${item.url ? `onclick="window.open('${this.esc(item.url)}','_blank')"` : ''}>
                <img src="${this.esc(item.image) || ph}" alt="${this.esc(item.name)}" class="item-image" loading="lazy" onerror="this.src='${ph}'">
                <div class="item-content">
                    <span class="item-category">${catLabels || 'その他'}</span>
                    <h3 class="item-name">${this.esc(item.name)}</h3>
                    ${item.description ? `<p class="item-description">${this.esc(item.description)}</p>` : ''}
                    <div class="item-meta">
                        <span class="item-meta-item">${areaLabels || '未設定'}</span>
                        ${meta2 ? `<span class="item-meta-item">${this.esc(meta2)}</span>` : ''}
                    </div>
                </div>
            </div>
        </article>`;
    }

    openModal(el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
    closeModal(el) { el.classList.remove('active'); document.body.style.overflow = ''; }

    openBentoEditModal(shop) {
        this.elements.bentoEditId.value = shop.id;
        this.elements.bentoEditUrl.value = shop.url || '';
        this.elements.bentoEditName.value = shop.name || '';
        this.elements.bentoEditPrice.value = shop.price || '';
        this.elements.bentoEditImage.value = shop.image || '';
        this.elements.bentoEditDescription.value = shop.description || '';
        
        const cats = config.getBentoCategoriesWithoutAll();
        const selCats = shop.category ? shop.category.split(',').map(c => c.trim()) : [];
        this.elements.bentoEditCategoryCheckboxes.innerHTML = Object.entries(cats).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="editCategory" value="${id}" ${selCats.includes(id)?'checked':''}><span>${this.esc(name)}</span></label>`
        ).join('');
        
        const areas = config.getBentoAreasWithoutAll();
        const selAreas = shop.area ? shop.area.split(',').map(a => a.trim()) : [];
        this.elements.bentoEditAreaCheckboxes.innerHTML = Object.entries(areas).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="editArea" value="${id}" ${selAreas.includes(id)?'checked':''}><span>${this.esc(name)}</span></label>`
        ).join('');
        
        this.openModal(this.elements.bentoEditOverlay);
    }

    openLocationEditModal(loc) {
        this.elements.locationEditId.value = loc.id;
        this.elements.locationEditUrl.value = loc.url || '';
        this.elements.locationEditName.value = loc.name || '';
        this.elements.locationEditAddress.value = loc.address || '';
        this.elements.locationEditImage.value = loc.image || '';
        this.elements.locationEditDescription.value = loc.description || '';
        
        const cats = config.getLocationCategoriesWithoutAll();
        const selCats = loc.category ? loc.category.split(',').map(c => c.trim()) : [];
        this.elements.locationEditCategoryCheckboxes.innerHTML = Object.entries(cats).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="editCategory" value="${id}" ${selCats.includes(id)?'checked':''}><span>${this.esc(name)}</span></label>`
        ).join('');
        
        const areas = config.getLocationAreasWithoutAll();
        const selAreas = loc.area ? loc.area.split(',').map(a => a.trim()) : [];
        this.elements.locationEditAreaCheckboxes.innerHTML = Object.entries(areas).map(([id, name]) => 
            `<label class="checkbox-label"><input type="checkbox" name="editArea" value="${id}" ${selAreas.includes(id)?'checked':''}><span>${this.esc(name)}</span></label>`
        ).join('');
        
        this.openModal(this.elements.locationEditOverlay);
    }

    openSettingsModal() {
        const s = config.getAll();
        this.elements.gasUrl.value = s.gasUrl || '';
        this.updateConnectionStatus(s.isSetupComplete ? 'connected' : 'demo');
        this.openModal(this.elements.settingsOverlay);
    }

    updateConnectionStatus(status, text) {
        const ind = this.elements.settingsStatus.querySelector('.status-indicator');
        const sp = this.elements.settingsStatus.querySelector('span:last-child');
        ind.className = 'status-indicator status-' + status;
        sp.textContent = text || (status === 'connected' ? '接続済み' : '未設定（デモモード）');
    }

    renderCategoryList(container, items) {
        if (!items || !items.length) { container.innerHTML = '<p style="color:#888;font-size:13px">項目がありません</p>'; return; }
        container.innerHTML = items.map(item => `
            <div class="category-item ${item.isDefault ? 'default' : ''}" data-id="${item.id}">
                <span>${this.esc(item.name)}</span>
                <button type="button" class="delete-btn" title="削除">&times;</button>
            </div>
        `).join('');
    }

    showSetupNotice(show) {
        this.elements.setupNotice.style.display = show ? 'block' : 'none';
        if (typeof adjustContentMargin === 'function') setTimeout(adjustContentMargin, 10);
    }

    showLoading(type, show) {
        const el = type === 'bento' ? this.elements.bentoLoading : this.elements.locationLoading;
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    updateImagePreview(type, imageUrl) {
        const previewEl = type === 'bento' ? this.elements.bentoImagePreview : this.elements.locationImagePreview;
        if (!previewEl) return;
        
        if (imageUrl) {
            previewEl.innerHTML = `<img src="${this.esc(imageUrl)}" alt="プレビュー" onerror="this.parentElement.innerHTML='<span class=\\'preview-placeholder\\'>画像を読み込めませんでした</span>'">`;
        } else {
            previewEl.innerHTML = '<span class="preview-placeholder">画像URLを入力するとプレビュー表示</span>';
        }
    }

    updateFetchStatus(type, status, message) {
        const statusEl = type === 'bento' ? this.elements.bentoFetchStatus : this.elements.locationFetchStatus;
        if (!statusEl) return;
        
        statusEl.className = 'fetch-status ' + status;
        statusEl.textContent = message || '';
    }

    showToast(message, type = 'success') {
        this.elements.toast.textContent = message;
        this.elements.toast.className = 'toast ' + type + ' show';
        setTimeout(() => this.elements.toast.classList.remove('show'), 3000);
    }

    async copyToClipboard(text) {
        try { await navigator.clipboard.writeText(text); return true; } 
        catch { return false; }
    }

    esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
}

const ui = new LokeNaviUI();

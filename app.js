// ===========================
// app.js - アプリケーション
// ===========================

let bentoShops = [];
let locations = [];
let filteredBento = [];
let filteredLocations = [];

let bentoFilters = { category: 'all', area: 'all', price: 'all', search: '' };
let locationFilters = { category: 'all', area: 'all', search: '' };

document.addEventListener('DOMContentLoaded', async () => {
    ui.init();
    initUI();
    initEventListeners();
    checkSetupStatus();
    await loadAllData();
});

function initUI() {
    ui.updateBentoCategoryChips();
    ui.updateBentoAreaSelect();
    ui.updateBentoFormCheckboxes();
    ui.updateLocationCategoryChips();
    ui.updateLocationAreaSelect();
    ui.updateLocationFormCheckboxes();
}

function checkSetupStatus() {
    ui.showSetupNotice(!config.isReady());
}

async function loadAllData() {
    ui.showLoading('bento', true);
    ui.showLoading('location', true);
    
    try {
        const data = await api.getAll();
        
        config.updateBentoCategories(data.bentoCategories || []);
        config.updateBentoAreas(data.bentoAreas || []);
        config.updateLocationCategories(data.locationCategories || []);
        config.updateLocationAreas(data.locationAreas || []);
        
        initUI();
        
        bentoShops = data.bentoShops || [];
        locations = data.locations || [];
        
        applyBentoFilters();
        applyLocationFilters();
    } catch (e) {
        console.error('Load error:', e);
        bentoShops = [];
        locations = [];
        applyBentoFilters();
        applyLocationFilters();
    } finally {
        ui.showLoading('bento', false);
        ui.showLoading('location', false);
    }
}

function initEventListeners() {
    // サイドバー
    ui.elements.sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => ui.switchPage(btn.dataset.page));
    });
    
    // 弁当フィルター
    ui.elements.bentoCategoryChips.addEventListener('click', e => {
        if (e.target.classList.contains('chip')) {
            ui.elements.bentoCategoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            bentoFilters.category = e.target.dataset.category;
            applyBentoFilters();
        }
    });
    ui.elements.bentoAreaFilter.addEventListener('change', e => { bentoFilters.area = e.target.value; applyBentoFilters(); });
    ui.elements.bentoPriceFilter.addEventListener('change', e => { bentoFilters.price = e.target.value; applyBentoFilters(); });
    ui.elements.bentoSearchInput.addEventListener('input', debounce(e => { bentoFilters.search = e.target.value.toLowerCase(); applyBentoFilters(); }, 300));
    
    // ロケ地フィルター
    ui.elements.locationCategoryChips.addEventListener('click', e => {
        if (e.target.classList.contains('chip')) {
            ui.elements.locationCategoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            locationFilters.category = e.target.dataset.category;
            applyLocationFilters();
        }
    });
    ui.elements.locationAreaFilter.addEventListener('change', e => { locationFilters.area = e.target.value; applyLocationFilters(); });
    ui.elements.locationSearchInput.addEventListener('input', debounce(e => { locationFilters.search = e.target.value.toLowerCase(); applyLocationFilters(); }, 300));
    
    // 弁当モーダル
    ui.elements.openBentoModal.addEventListener('click', () => ui.openModal(ui.elements.bentoModalOverlay));
    ui.elements.closeBentoModal.addEventListener('click', () => ui.closeModal(ui.elements.bentoModalOverlay));
    ui.elements.bentoModalOverlay.addEventListener('click', e => { if (e.target === ui.elements.bentoModalOverlay) ui.closeModal(ui.elements.bentoModalOverlay); });
    ui.elements.bentoForm.addEventListener('submit', handleBentoSubmit);
    ui.elements.bentoFetchOgp.addEventListener('click', () => fetchOgp('bento'));
    
    // ロケ地モーダル
    ui.elements.openLocationModal.addEventListener('click', () => ui.openModal(ui.elements.locationModalOverlay));
    ui.elements.closeLocationModal.addEventListener('click', () => ui.closeModal(ui.elements.locationModalOverlay));
    ui.elements.locationModalOverlay.addEventListener('click', e => { if (e.target === ui.elements.locationModalOverlay) ui.closeModal(ui.elements.locationModalOverlay); });
    ui.elements.locationForm.addEventListener('submit', handleLocationSubmit);
    ui.elements.locationFetchOgp.addEventListener('click', () => fetchOgp('location'));
    
    // 弁当編集
    ui.elements.closeBentoEdit.addEventListener('click', () => ui.closeModal(ui.elements.bentoEditOverlay));
    ui.elements.cancelBentoEdit.addEventListener('click', () => ui.closeModal(ui.elements.bentoEditOverlay));
    ui.elements.bentoEditOverlay.addEventListener('click', e => { if (e.target === ui.elements.bentoEditOverlay) ui.closeModal(ui.elements.bentoEditOverlay); });
    ui.elements.bentoEditForm.addEventListener('submit', handleBentoEditSubmit);
    
    // ロケ地編集
    ui.elements.closeLocationEdit.addEventListener('click', () => ui.closeModal(ui.elements.locationEditOverlay));
    ui.elements.cancelLocationEdit.addEventListener('click', () => ui.closeModal(ui.elements.locationEditOverlay));
    ui.elements.locationEditOverlay.addEventListener('click', e => { if (e.target === ui.elements.locationEditOverlay) ui.closeModal(ui.elements.locationEditOverlay); });
    ui.elements.locationEditForm.addEventListener('submit', handleLocationEditSubmit);
    
    // グリッドの編集・削除
    ui.elements.bentoGrid.addEventListener('click', handleGridClick);
    ui.elements.locationGrid.addEventListener('click', handleGridClick);
    
    // 設定
    ui.elements.openSettings.addEventListener('click', () => ui.openSettingsModal());
    ui.elements.closeSettings.addEventListener('click', () => ui.closeModal(ui.elements.settingsOverlay));
    ui.elements.settingsOverlay.addEventListener('click', e => { if (e.target === ui.elements.settingsOverlay) ui.closeModal(ui.elements.settingsOverlay); });
    ui.elements.setupNoticeBtn?.addEventListener('click', () => ui.openSettingsModal());
    ui.elements.testConnection.addEventListener('click', testConnection);
    ui.elements.runSetup.addEventListener('click', runSetup);
    ui.elements.copyGasCode.addEventListener('click', copyGASCode);
    ui.elements.resetSettings.addEventListener('click', resetSettings);
    
    // カテゴリ・エリア管理
    ui.elements.addBentoCategoryBtn.addEventListener('click', () => addCategory('bento', 'category'));
    ui.elements.addBentoAreaBtn.addEventListener('click', () => addCategory('bento', 'area'));
    ui.elements.addLocationCategoryBtn.addEventListener('click', () => addCategory('location', 'category'));
    ui.elements.addLocationAreaBtn.addEventListener('click', () => addCategory('location', 'area'));
    
    ui.elements.bentoCategoryList.addEventListener('click', e => handleCategoryDelete(e, 'bento', 'category'));
    ui.elements.bentoAreaList.addEventListener('click', e => handleCategoryDelete(e, 'bento', 'area'));
    ui.elements.locationCategoryList.addEventListener('click', e => handleCategoryDelete(e, 'location', 'category'));
    ui.elements.locationAreaList.addEventListener('click', e => handleCategoryDelete(e, 'location', 'area'));
    
    // ESCキー
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            ui.closeModal(ui.elements.bentoModalOverlay);
            ui.closeModal(ui.elements.locationModalOverlay);
            ui.closeModal(ui.elements.bentoEditOverlay);
            ui.closeModal(ui.elements.locationEditOverlay);
            ui.closeModal(ui.elements.settingsOverlay);
        }
    });
}

function applyBentoFilters() {
    filteredBento = bentoShops.filter(shop => {
        if (bentoFilters.category !== 'all') {
            const cats = shop.category ? shop.category.split(',').map(c => c.trim()) : [];
            if (!cats.includes(bentoFilters.category)) return false;
        }
        if (bentoFilters.area !== 'all') {
            const areas = shop.area ? shop.area.split(',').map(a => a.trim()) : [];
            if (!areas.includes(bentoFilters.area)) return false;
        }
        if (bentoFilters.price !== 'all' && shop.price !== bentoFilters.price) return false;
        if (bentoFilters.search && !`${shop.name} ${shop.description}`.toLowerCase().includes(bentoFilters.search)) return false;
        return true;
    });
    ui.renderBentoShops(filteredBento);
}

function applyLocationFilters() {
    filteredLocations = locations.filter(loc => {
        if (locationFilters.category !== 'all') {
            const cats = loc.category ? loc.category.split(',').map(c => c.trim()) : [];
            if (!cats.includes(locationFilters.category)) return false;
        }
        if (locationFilters.area !== 'all') {
            const areas = loc.area ? loc.area.split(',').map(a => a.trim()) : [];
            if (!areas.includes(locationFilters.area)) return false;
        }
        if (locationFilters.search && !`${loc.name} ${loc.description} ${loc.address}`.toLowerCase().includes(locationFilters.search)) return false;
        return true;
    });
    ui.renderLocations(filteredLocations);
}

async function fetchOgp(type) {
    const urlEl = type === 'bento' ? ui.elements.bentoUrl : ui.elements.locationUrl;
    const nameEl = type === 'bento' ? ui.elements.bentoName : ui.elements.locationName;
    const imageEl = type === 'bento' ? ui.elements.bentoImage : ui.elements.locationImage;
    const descEl = type === 'bento' ? ui.elements.bentoDescription : ui.elements.locationDescription;
    const btn = type === 'bento' ? ui.elements.bentoFetchOgp : ui.elements.locationFetchOgp;
    
    const url = urlEl.value.trim();
    if (!url) { ui.showToast('URLを入力してください', 'error'); return; }
    
    btn.disabled = true;
    btn.textContent = '取得中...';
    
    try {
        const ogp = await api.fetchOgp(url);
        if (ogp.title) nameEl.value = ogp.title;
        if (ogp.image) imageEl.value = ogp.image;
        if (ogp.description) descEl.value = ogp.description;
        ui.showToast('情報を取得しました');
    } catch (e) {
        ui.showToast('取得に失敗しました', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '取得';
    }
}

function getCheckedValues(container) {
    return Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
}

async function handleBentoSubmit(e) {
    e.preventDefault();
    
    const cats = getCheckedValues(ui.elements.bentoCategoryCheckboxes);
    const areas = getCheckedValues(ui.elements.bentoAreaCheckboxes);
    
    if (!cats.length) { ui.showToast('カテゴリを選択してください', 'error'); return; }
    if (!areas.length) { ui.showToast('エリアを選択してください', 'error'); return; }
    
    ui.elements.bentoSubmit.disabled = true;
    ui.elements.bentoSubmit.textContent = '登録中...';
    
    try {
        await api.addBentoShop({
            url: ui.elements.bentoUrl.value.trim(),
            name: ui.elements.bentoName.value.trim(),
            category: cats.join(','),
            area: areas.join(','),
            price: ui.elements.bentoPrice.value,
            image: ui.elements.bentoImage.value.trim(),
            description: ui.elements.bentoDescription.value.trim()
        });
        
        ui.closeModal(ui.elements.bentoModalOverlay);
        ui.elements.bentoForm.reset();
        ui.showToast('登録しました');
        await loadAllData();
    } catch (e) {
        ui.showToast(e.message, 'error');
    } finally {
        ui.elements.bentoSubmit.disabled = false;
        ui.elements.bentoSubmit.textContent = '登録する';
    }
}

async function handleLocationSubmit(e) {
    e.preventDefault();
    
    const cats = getCheckedValues(ui.elements.locationCategoryCheckboxes);
    const areas = getCheckedValues(ui.elements.locationAreaCheckboxes);
    
    if (!cats.length) { ui.showToast('カテゴリを選択してください', 'error'); return; }
    if (!areas.length) { ui.showToast('エリアを選択してください', 'error'); return; }
    
    ui.elements.locationSubmit.disabled = true;
    ui.elements.locationSubmit.textContent = '登録中...';
    
    try {
        await api.addLocation({
            url: ui.elements.locationUrl.value.trim(),
            name: ui.elements.locationName.value.trim(),
            category: cats.join(','),
            area: areas.join(','),
            address: ui.elements.locationAddress.value.trim(),
            image: ui.elements.locationImage.value.trim(),
            description: ui.elements.locationDescription.value.trim()
        });
        
        ui.closeModal(ui.elements.locationModalOverlay);
        ui.elements.locationForm.reset();
        ui.showToast('登録しました');
        await loadAllData();
    } catch (e) {
        ui.showToast(e.message, 'error');
    } finally {
        ui.elements.locationSubmit.disabled = false;
        ui.elements.locationSubmit.textContent = '登録する';
    }
}

async function handleBentoEditSubmit(e) {
    e.preventDefault();
    
    const cats = getCheckedValues(ui.elements.bentoEditCategoryCheckboxes);
    const areas = getCheckedValues(ui.elements.bentoEditAreaCheckboxes);
    
    if (!cats.length) { ui.showToast('カテゴリを選択してください', 'error'); return; }
    if (!areas.length) { ui.showToast('エリアを選択してください', 'error'); return; }
    
    ui.elements.saveBentoEdit.disabled = true;
    ui.elements.saveBentoEdit.textContent = '保存中...';
    
    try {
        await api.updateBentoShop({
            id: ui.elements.bentoEditId.value,
            url: ui.elements.bentoEditUrl.value.trim(),
            name: ui.elements.bentoEditName.value.trim(),
            category: cats.join(','),
            area: areas.join(','),
            price: ui.elements.bentoEditPrice.value,
            image: ui.elements.bentoEditImage.value.trim(),
            description: ui.elements.bentoEditDescription.value.trim()
        });
        
        ui.closeModal(ui.elements.bentoEditOverlay);
        ui.showToast('更新しました');
        await loadAllData();
    } catch (e) {
        ui.showToast(e.message, 'error');
    } finally {
        ui.elements.saveBentoEdit.disabled = false;
        ui.elements.saveBentoEdit.textContent = '保存';
    }
}

async function handleLocationEditSubmit(e) {
    e.preventDefault();
    
    const cats = getCheckedValues(ui.elements.locationEditCategoryCheckboxes);
    const areas = getCheckedValues(ui.elements.locationEditAreaCheckboxes);
    
    if (!cats.length) { ui.showToast('カテゴリを選択してください', 'error'); return; }
    if (!areas.length) { ui.showToast('エリアを選択してください', 'error'); return; }
    
    ui.elements.saveLocationEdit.disabled = true;
    ui.elements.saveLocationEdit.textContent = '保存中...';
    
    try {
        await api.updateLocation({
            id: ui.elements.locationEditId.value,
            url: ui.elements.locationEditUrl.value.trim(),
            name: ui.elements.locationEditName.value.trim(),
            category: cats.join(','),
            area: areas.join(','),
            address: ui.elements.locationEditAddress.value.trim(),
            image: ui.elements.locationEditImage.value.trim(),
            description: ui.elements.locationEditDescription.value.trim()
        });
        
        ui.closeModal(ui.elements.locationEditOverlay);
        ui.showToast('更新しました');
        await loadAllData();
    } catch (e) {
        ui.showToast(e.message, 'error');
    } finally {
        ui.elements.saveLocationEdit.disabled = false;
        ui.elements.saveLocationEdit.textContent = '保存';
    }
}

function handleGridClick(e) {
    const editBtn = e.target.closest('.item-edit-btn');
    const deleteBtn = e.target.closest('.item-delete-btn');
    
    if (editBtn) {
        e.stopPropagation();
        const { id, type } = editBtn.dataset;
        if (type === 'bento') {
            const shop = bentoShops.find(s => s.id.toString() === id);
            if (shop) ui.openBentoEditModal(shop);
        } else {
            const loc = locations.find(l => l.id.toString() === id);
            if (loc) ui.openLocationEditModal(loc);
        }
    }
    
    if (deleteBtn) {
        e.stopPropagation();
        const { id, type } = deleteBtn.dataset;
        deleteItem(id, type);
    }
}

async function deleteItem(id, type) {
    const items = type === 'bento' ? bentoShops : locations;
    const item = items.find(i => i.id.toString() === id);
    if (!confirm(`「${item?.name || ''}」を削除しますか？`)) return;
    
    try {
        if (type === 'bento') await api.deleteBentoShop(id);
        else await api.deleteLocation(id);
        ui.showToast('削除しました');
        await loadAllData();
    } catch (e) {
        ui.showToast(e.message, 'error');
    }
}

async function testConnection() {
    const url = ui.elements.gasUrl.value.trim();
    if (!url) { ui.showToast('URLを入力してください', 'error'); return; }
    
    ui.elements.testConnection.disabled = true;
    ui.elements.testConnection.textContent = 'テスト中...';
    
    try {
        const result = await api.testConnection(url);
        ui.updateConnectionStatus(result.success ? 'connected' : 'error', result.success ? '接続成功' : '接続失敗');
        ui.showToast(result.success ? '接続成功' : '接続失敗', result.success ? 'success' : 'error');
    } catch (e) {
        ui.updateConnectionStatus('error', '接続エラー');
        ui.showToast('接続テストに失敗しました', 'error');
    } finally {
        ui.elements.testConnection.disabled = false;
        ui.elements.testConnection.textContent = '接続テスト';
    }
}

async function runSetup() {
    const url = ui.elements.gasUrl.value.trim();
    if (!url) { ui.showToast('URLを入力してください', 'error'); return; }
    
    ui.elements.runSetup.disabled = true;
    ui.elements.runSetup.textContent = 'セットアップ中...';
    
    try {
        await api.setup(url);
        ui.updateConnectionStatus('connected', '接続済み');
        ui.showToast('セットアップ完了');
        ui.showSetupNotice(false);
        await loadAllData();
        await refreshSettingsLists();
    } catch (e) {
        ui.updateConnectionStatus('error', 'セットアップ失敗');
        ui.showToast(e.message, 'error');
    } finally {
        ui.elements.runSetup.disabled = false;
        ui.elements.runSetup.textContent = 'セットアップを実行';
    }
}

async function copyGASCode() {
    const success = await ui.copyToClipboard(GAS_CODE);
    ui.showToast(success ? 'コピーしました' : 'コピーに失敗しました', success ? 'success' : 'error');
}

function resetSettings() {
    if (!confirm('設定をリセットしますか？')) return;
    config.reset();
    ui.elements.gasUrl.value = '';
    ui.updateConnectionStatus('demo');
    ui.showSetupNotice(true);
    ui.showToast('リセットしました');
}

async function addCategory(page, type) {
    const inputEl = ui.elements[`new${capitalize(page)}${capitalize(type)}Name`];
    const name = inputEl.value.trim();
    if (!name) { ui.showToast('名前を入力してください', 'error'); return; }
    
    try {
        if (page === 'bento' && type === 'category') await api.addBentoCategory(name);
        else if (page === 'bento' && type === 'area') await api.addBentoArea(name);
        else if (page === 'location' && type === 'category') await api.addLocationCategory(name);
        else if (page === 'location' && type === 'area') await api.addLocationArea(name);
        
        inputEl.value = '';
        ui.showToast('追加しました');
        await loadAllData();
        await refreshSettingsLists();
    } catch (e) {
        ui.showToast(e.message, 'error');
    }
}

async function handleCategoryDelete(e, page, type) {
    if (!e.target.classList.contains('delete-btn')) return;
    const item = e.target.closest('.category-item');
    if (!item) return;
    
    const id = item.dataset.id;
    if (!confirm('削除しますか？')) return;
    
    try {
        if (page === 'bento' && type === 'category') await api.deleteBentoCategory(id);
        else if (page === 'bento' && type === 'area') await api.deleteBentoArea(id);
        else if (page === 'location' && type === 'category') await api.deleteLocationCategory(id);
        else if (page === 'location' && type === 'area') await api.deleteLocationArea(id);
        
        ui.showToast('削除しました');
        await loadAllData();
        await refreshSettingsLists();
    } catch (e) {
        ui.showToast(e.message, 'error');
    }
}

async function refreshSettingsLists() {
    try {
        const data = await api.getAll();
        ui.renderCategoryList(ui.elements.bentoCategoryList, data.bentoCategories);
        ui.renderCategoryList(ui.elements.bentoAreaList, data.bentoAreas);
        ui.renderCategoryList(ui.elements.locationCategoryList, data.locationCategories);
        ui.renderCategoryList(ui.elements.locationAreaList, data.locationAreas);
    } catch (e) {}
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

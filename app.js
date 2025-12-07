// ===========================
// app.js - メインアプリケーションロジック
// ===========================

let shops = [];
let filteredShops = [];
let currentFilters = {
    category: 'all',
    area: 'all',
    price: 'all',
    search: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    ui.init();
    
    // カテゴリ・エリアUIを初期化（デフォルトで表示）
    ui.updateFilterCategoryChips();
    ui.updateFormCategoryCheckboxes();
    ui.updateFilterAreaSelect();
    ui.updateFormAreaCheckboxes();
    
    initEventListeners();
    checkSetupStatus();
    
    // カテゴリ・エリア・ショップを読み込み
    await loadCategories();
    await loadAreas();
    loadShops();
});

function initEventListeners() {
    // 登録モーダル
    ui.elements.openModal.addEventListener('click', () => ui.openShopModal());
    ui.elements.closeModal.addEventListener('click', () => ui.closeShopModal());
    ui.elements.cancelBtn.addEventListener('click', () => ui.closeShopModal());
    ui.elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === ui.elements.modalOverlay) ui.closeShopModal();
    });
    
    // 設定モーダル
    ui.elements.openSettings.addEventListener('click', () => ui.openSettingsModal());
    ui.elements.closeSettings.addEventListener('click', () => ui.closeSettingsModal());
    ui.elements.cancelSettings.addEventListener('click', () => ui.closeSettingsModal());
    ui.elements.settingsOverlay.addEventListener('click', (e) => {
        if (e.target === ui.elements.settingsOverlay) ui.closeSettingsModal();
    });
    
    // 設定アクション
    ui.elements.testConnection.addEventListener('click', testConnection);
    ui.elements.runSetup.addEventListener('click', runSetup);
    ui.elements.copyGasCode.addEventListener('click', copyGASCode);
    ui.elements.resetSettings.addEventListener('click', resetSettings);
    
    // カテゴリ管理
    ui.elements.addCategoryBtn.addEventListener('click', addCategory);
    ui.elements.newCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCategory();
        }
    });
    ui.elements.categoryList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const item = e.target.closest('.category-item');
            if (item) {
                deleteCategory(item.dataset.id);
            }
        }
    });

    // エリア管理
    ui.elements.addAreaBtn.addEventListener('click', addArea);
    ui.elements.newAreaName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addArea();
        }
    });
    ui.elements.areaList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const item = e.target.closest('.category-item');
            if (item && item.dataset.type === 'area') {
                deleteArea(item.dataset.id);
            }
        }
    });
    
    // セットアップ通知
    if (ui.elements.setupNoticeBtn) {
        ui.elements.setupNoticeBtn.addEventListener('click', () => ui.openSettingsModal());
    }
    
    // フォーム
    ui.elements.shopForm.addEventListener('submit', handleFormSubmit);
    ui.elements.fetchBtn.addEventListener('click', fetchOGPData);
    
    // URL入力時に自動でOGP取得
    let urlInputTimeout;
    ui.elements.shopUrl.addEventListener('input', (e) => {
        clearTimeout(urlInputTimeout);
        const url = e.target.value.trim();
        
        // 有効なURLの場合、1秒後に自動取得
        if (url && ui.isValidUrl(url)) {
            urlInputTimeout = setTimeout(() => {
                fetchOGPData();
            }, 1000);
        }
    });
    
    // ペースト時は即座に取得
    ui.elements.shopUrl.addEventListener('paste', (e) => {
        setTimeout(() => {
            const url = ui.elements.shopUrl.value.trim();
            if (url && ui.isValidUrl(url)) {
                fetchOGPData();
            }
        }, 100);
    });
    
    // フィルター
    ui.elements.categoryChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilters.category = e.target.dataset.category;
            applyFilters();
        }
    });
    
    ui.elements.areaFilter.addEventListener('change', (e) => {
        currentFilters.area = e.target.value;
        applyFilters();
    });
    
    ui.elements.priceFilter.addEventListener('change', (e) => {
        currentFilters.price = e.target.value;
        applyFilters();
    });
    
    let searchTimeout;
    ui.elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300);
    });
    
    // キーボード
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ui.closeShopModal();
            ui.closeSettingsModal();
            ui.closeEditModal();
        }
    });
    
    // 店舗グリッドの編集・削除ボタン
    ui.elements.shopsGrid.addEventListener('click', (e) => {
        // 編集ボタン
        if (e.target.classList.contains('shop-edit-btn')) {
            e.stopPropagation();
            const shopId = e.target.dataset.id;
            const shop = shops.find(s => s.id.toString() === shopId.toString());
            if (shop) {
                ui.openEditModal(shop);
            }
        }
        // 削除ボタン
        if (e.target.classList.contains('shop-delete-btn')) {
            e.stopPropagation();
            const shopId = e.target.dataset.id;
            deleteShop(shopId);
        }
    });
    
    // 編集モーダル
    ui.elements.closeEditModal.addEventListener('click', () => ui.closeEditModal());
    ui.elements.cancelEdit.addEventListener('click', () => ui.closeEditModal());
    ui.elements.editOverlay.addEventListener('click', (e) => {
        if (e.target === ui.elements.editOverlay) {
            ui.closeEditModal();
        }
    });
    ui.elements.editForm.addEventListener('submit', handleEditSubmit);
}

// セットアップ状態を確認
function checkSetupStatus() {
    const isSetup = config.isReady();
    ui.showSetupNotice(!isSetup);
}

// データ読み込み
async function loadShops() {
    ui.showLoading(true);
    
    try {
        shops = await api.getShops();
        applyFilters();
    } catch (error) {
        console.error('Failed to load shops:', error);
        ui.showToast('データの読み込みに失敗しました', 'error');
        shops = [];
        applyFilters();
    } finally {
        ui.showLoading(false);
    }
}

// フィルター適用
function applyFilters() {
    filteredShops = shops.filter(shop => {
        // カテゴリフィルター（複数カテゴリ対応）
        if (currentFilters.category !== 'all') {
            const shopCategories = shop.category ? shop.category.split(',').map(c => c.trim()) : [];
            if (!shopCategories.includes(currentFilters.category)) {
                return false;
            }
        }
        // エリアフィルター（複数エリア対応）
        if (currentFilters.area !== 'all') {
            const shopAreas = shop.area ? shop.area.split(',').map(a => a.trim()) : [];
            if (!shopAreas.includes(currentFilters.area)) {
                return false;
            }
        }
        if (currentFilters.price !== 'all' && shop.price !== currentFilters.price) {
            return false;
        }
        if (currentFilters.search) {
            const searchText = `${shop.name} ${shop.description} ${shop.area}`.toLowerCase();
            if (!searchText.includes(currentFilters.search)) {
                return false;
            }
        }
        return true;
    });
    
    ui.renderShops(filteredShops);
}

// OGP情報取得
async function fetchOGPData() {
    const url = ui.elements.shopUrl.value.trim();
    
    if (!url) {
        return;
    }
    
    if (!ui.isValidUrl(url)) {
        return;
    }
    
    ui.setFetchButtonLoading(true);
    
    try {
        const ogpData = await api.fetchOGP(url);
        
        ui.showPreview({
            title: ogpData.title || 'タイトル未取得',
            url: url,
            image: ogpData.image
        });
        
        // 取得したデータを自動入力（空欄の場合のみ）
        if (ogpData.title && !ui.elements.shopName.value) {
            ui.elements.shopName.value = ogpData.title;
        }
        if (ogpData.image && !ui.elements.shopImage.value) {
            ui.elements.shopImage.value = ogpData.image;
        }
        // メモは自動入力しない（手動入力のみ）
        
        if (ogpData.title) {
            ui.showToast('情報を取得しました');
        } else {
            ui.showToast('一部情報を取得できませんでした', 'error');
        }
    } catch (error) {
        console.error('OGP fetch error:', error);
        
        // エラー時もプレビューは表示
        ui.showPreview({
            title: 'タイトル未取得',
            url: url,
            image: null
        });
        
        ui.showToast('情報の取得に失敗しました', 'error');
    } finally {
        ui.setFetchButtonLoading(false);
    }
}

// フォーム送信
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // 選択されたカテゴリを取得
    const selectedCategories = [];
    const catCheckboxes = ui.elements.shopCategoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    catCheckboxes.forEach(cb => selectedCategories.push(cb.value));
    
    if (selectedCategories.length === 0) {
        ui.showToast('カテゴリを1つ以上選択してください', 'error');
        return;
    }
    
    // 選択されたエリアを取得
    const selectedAreas = [];
    const areaCheckboxes = ui.elements.shopAreaCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    areaCheckboxes.forEach(cb => selectedAreas.push(cb.value));
    
    if (selectedAreas.length === 0) {
        ui.showToast('配達エリアを1つ以上選択してください', 'error');
        return;
    }
    
    ui.setSubmitButtonLoading(true);
    
    const shopData = {
        url: ui.elements.shopUrl.value.trim(),
        name: ui.elements.shopName.value.trim(),
        category: selectedCategories.join(','),
        area: selectedAreas.join(','),
        price: ui.elements.shopPrice.value,
        image: ui.elements.shopImage.value.trim(),
        description: ui.elements.shopDescription.value.trim()
    };
    
    try {
        const newShop = await api.addShop(shopData);
        
        shops.unshift(newShop);
        ui.updateAreaFilter(shops);
        applyFilters();
        
        ui.closeShopModal();
        ui.showToast('お店を登録しました');
    } catch (error) {
        console.error('Submit error:', error);
        ui.showToast(error.message || '登録に失敗しました', 'error');
    } finally {
        ui.setSubmitButtonLoading(false);
    }
}

// 接続テスト
async function testConnection() {
    const gasUrl = ui.elements.gasUrl.value.trim();
    
    if (!gasUrl) {
        ui.showToast('GAS URLを入力してください', 'error');
        return;
    }
    
    ui.elements.testConnection.disabled = true;
    ui.elements.testConnection.textContent = 'テスト中...';
    
    try {
        const result = await api.testConnection(gasUrl);
        
        if (result.success) {
            ui.updateConnectionStatus('connected', '接続成功');
            ui.showToast('接続成功');
        } else {
            ui.updateConnectionStatus('error', '接続失敗');
            ui.showToast('接続失敗: ' + result.error, 'error');
        }
    } catch (error) {
        ui.updateConnectionStatus('error', '接続エラー');
        ui.showToast('接続テストに失敗しました', 'error');
    } finally {
        ui.elements.testConnection.disabled = false;
        ui.elements.testConnection.textContent = '接続テスト';
    }
}

// 初回セットアップ実行
async function runSetup() {
    const gasUrl = ui.elements.gasUrl.value.trim();
    
    if (!gasUrl) {
        ui.showToast('GAS URLを入力してください', 'error');
        return;
    }
    
    ui.setSetupButtonLoading(true);
    
    try {
        const result = await api.setup(gasUrl);
        
        ui.updateConnectionStatus('connected', '接続済み');
        ui.showToast(result.message || 'セットアップが完了しました');
        
        // 通知を非表示
        ui.showSetupNotice(false);
        
        // カテゴリとデータを再読み込み
        await loadCategories();
        await loadShops();
        
        // カテゴリ一覧を更新
        const categories = await api.getCategories();
        ui.renderCategoryList(categories);
        
        // モーダルを閉じる
        setTimeout(() => {
            ui.closeSettingsModal();
        }, 1000);
        
    } catch (error) {
        console.error('Setup error:', error);
        ui.updateConnectionStatus('error', 'セットアップ失敗');
        ui.showToast(error.message || 'セットアップに失敗しました', 'error');
    } finally {
        ui.setSetupButtonLoading(false);
    }
}

// GASコードをコピー
async function copyGASCode() {
    const success = await ui.copyToClipboard(GAS_CODE);
    
    if (success) {
        ui.showToast('コードをコピーしました');
        ui.elements.copyGasCode.textContent = 'コピーしました';
        setTimeout(() => {
            ui.elements.copyGasCode.textContent = 'GASコードをコピー';
        }, 2000);
    } else {
        ui.showToast('コピーに失敗しました', 'error');
    }
}

// 設定をリセット
function resetSettings() {
    if (confirm('設定をリセットしますか？スプレッドシートのデータは削除されません。')) {
        config.reset();
        ui.elements.gasUrl.value = '';
        ui.updateConnectionStatus('demo', '未設定（デモモード）');
        ui.showSetupNotice(true);
        ui.renderCategoryList([]);
        ui.updateFilterCategoryChips();
        ui.updateFormCategoryCheckboxes();
        ui.showToast('設定をリセットしました');
        loadShops();
    }
}

// カテゴリを読み込み
async function loadCategories() {
    try {
        const categories = await api.getCategories();
        config.updateCategories(categories);
        ui.updateFilterCategoryChips();
        ui.updateFormCategoryCheckboxes();
        return categories;
    } catch (error) {
        console.error('Failed to load categories:', error);
        // エラー時はデフォルトカテゴリを使用
        return [];
    }
}

// カテゴリを追加
async function addCategory() {
    const name = ui.elements.newCategoryName.value.trim();
    
    if (!name) {
        ui.showToast('カテゴリ名を入力してください', 'error');
        return;
    }
    
    if (!api.hasGasUrl()) {
        ui.showToast('スプレッドシートを設定してください', 'error');
        return;
    }
    
    try {
        await api.addCategory(name);
        ui.elements.newCategoryName.value = '';
        
        // カテゴリを再読み込み
        await loadCategories();
        ui.renderCategoryList(await api.getCategories());
        
        ui.showToast(`カテゴリ「${name}」を追加しました`);
    } catch (error) {
        ui.showToast(error.message, 'error');
    }
}

// カテゴリを削除
async function deleteCategory(id) {
    const categories = config.getAllCategoriesWithoutAll();
    const name = categories[id];
    
    if (!confirm(`カテゴリ「${name}」を削除しますか？`)) {
        return;
    }
    
    try {
        await api.deleteCategory(id);
        
        // カテゴリを再読み込み
        await loadCategories();
        ui.renderCategoryList(await api.getCategories());
        
        ui.showToast(`カテゴリ「${name}」を削除しました`);
    } catch (error) {
        ui.showToast(error.message, 'error');
    }
}

// エリアを読み込み
async function loadAreas() {
    try {
        const areas = await api.getAreas();
        config.updateAreas(areas);
        ui.updateFilterAreaSelect();
        ui.updateFormAreaCheckboxes();
        return areas;
    } catch (error) {
        console.error('Failed to load areas:', error);
        return [];
    }
}

// エリアを追加
async function addArea() {
    const name = ui.elements.newAreaName.value.trim();
    
    if (!name) {
        ui.showToast('エリア名を入力してください', 'error');
        return;
    }
    
    if (!api.hasGasUrl()) {
        ui.showToast('スプレッドシートを設定してください', 'error');
        return;
    }
    
    try {
        await api.addArea(name);
        ui.elements.newAreaName.value = '';
        
        await loadAreas();
        ui.renderAreaList(await api.getAreas());
        
        ui.showToast(`エリア「${name}」を追加しました`);
    } catch (error) {
        ui.showToast(error.message, 'error');
    }
}

// エリアを削除
async function deleteArea(id) {
    const areas = config.getAllAreasWithoutAll();
    const name = areas[id];
    
    if (!confirm(`エリア「${name}」を削除しますか？`)) {
        return;
    }
    
    try {
        await api.deleteArea(id);
        
        await loadAreas();
        ui.renderAreaList(await api.getAreas());
        
        ui.showToast(`エリア「${name}」を削除しました`);
    } catch (error) {
        ui.showToast(error.message, 'error');
    }
}

// 店舗を削除
async function deleteShop(shopId) {
    const shop = shops.find(s => s.id.toString() === shopId.toString());
    const name = shop ? shop.name : '店舗';
    
    if (!confirm(`「${name}」を削除しますか？`)) {
        return;
    }
    
    try {
        await api.deleteShop(shopId);
        ui.showToast(`「${name}」を削除しました`);
        await loadShops();
    } catch (error) {
        ui.showToast(error.message, 'error');
    }
}

// 編集フォーム送信
async function handleEditSubmit(e) {
    e.preventDefault();
    
    // 選択されたカテゴリを取得
    const selectedCategories = [];
    const catCheckboxes = ui.elements.editCategoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    catCheckboxes.forEach(cb => selectedCategories.push(cb.value));
    
    if (selectedCategories.length === 0) {
        ui.showToast('カテゴリを1つ以上選択してください', 'error');
        return;
    }
    
    // 選択されたエリアを取得
    const selectedAreas = [];
    const areaCheckboxes = ui.elements.editAreaCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    areaCheckboxes.forEach(cb => selectedAreas.push(cb.value));
    
    if (selectedAreas.length === 0) {
        ui.showToast('配達エリアを1つ以上選択してください', 'error');
        return;
    }
    
    ui.setEditButtonLoading(true);
    
    const shopData = {
        id: ui.elements.editShopId.value,
        url: ui.elements.editShopUrl.value.trim(),
        name: ui.elements.editShopName.value.trim(),
        category: selectedCategories.join(','),
        area: selectedAreas.join(','),
        price: ui.elements.editShopPrice.value,
        image: ui.elements.editShopImage.value.trim(),
        description: ui.elements.editShopDescription.value.trim()
    };
    
    try {
        await api.updateShop(shopData);
        ui.showToast('更新しました');
        ui.closeEditModal();
        await loadShops();
    } catch (error) {
        console.error('Update error:', error);
        ui.showToast(error.message || '更新に失敗しました', 'error');
    } finally {
        ui.setEditButtonLoading(false);
    }
}

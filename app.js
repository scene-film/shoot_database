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

document.addEventListener('DOMContentLoaded', () => {
    ui.init();
    initEventListeners();
    checkSetupStatus();
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
    
    // セットアップ通知
    if (ui.elements.setupNoticeBtn) {
        ui.elements.setupNoticeBtn.addEventListener('click', () => ui.openSettingsModal());
    }
    
    // フォーム
    ui.elements.shopForm.addEventListener('submit', handleFormSubmit);
    ui.elements.fetchBtn.addEventListener('click', fetchOGPData);
    
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
        }
    });
}

// セットアップ状態を確認
function checkSetupStatus() {
    const isSetup = config.isSetupComplete();
    ui.showSetupNotice(!isSetup);
}

// データ読み込み
async function loadShops() {
    ui.showLoading(true);
    
    try {
        shops = await api.getShops();
        ui.updateAreaFilter(shops);
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
        if (currentFilters.category !== 'all' && shop.category !== currentFilters.category) {
            return false;
        }
        if (currentFilters.area !== 'all' && shop.area !== currentFilters.area) {
            return false;
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
        ui.showToast('URLを入力してください', 'error');
        return;
    }
    
    if (!ui.isValidUrl(url)) {
        ui.showToast('有効なURLを入力してください', 'error');
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
        
        if (ogpData.title && !ui.elements.shopName.value) {
            ui.elements.shopName.value = ogpData.title;
        }
        if (ogpData.image && !ui.elements.shopImage.value) {
            ui.elements.shopImage.value = ogpData.image;
        }
        if (ogpData.description && !ui.elements.shopDescription.value) {
            ui.elements.shopDescription.value = ogpData.description;
        }
        
        ui.showToast('情報を取得しました');
    } catch (error) {
        console.error('OGP fetch error:', error);
        ui.showToast('情報の取得に失敗しました', 'error');
        
        ui.showPreview({
            title: 'タイトル未取得',
            url: url,
            image: null
        });
    } finally {
        ui.setFetchButtonLoading(false);
    }
}

// フォーム送信
async function handleFormSubmit(e) {
    e.preventDefault();
    
    ui.setSubmitButtonLoading(true);
    
    const shopData = {
        url: ui.elements.shopUrl.value.trim(),
        name: ui.elements.shopName.value.trim(),
        category: ui.elements.shopCategory.value,
        area: ui.elements.shopArea.value.trim(),
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
        
        // データを再読み込み
        await loadShops();
        
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
        ui.showToast('設定をリセットしました');
        loadShops();
    }
}

// ===========================
// ui.js - UI操作処理
// ===========================

class UI {
    constructor() {
        this.elements = {};
    }

    init() {
        this.elements = {
            shopsGrid: document.getElementById('shopsGrid'),
            shopCount: document.getElementById('shopCount'),
            noResults: document.getElementById('noResults'),
            loading: document.getElementById('loading'),
            
            categoryChips: document.getElementById('categoryChips'),
            areaFilter: document.getElementById('areaFilter'),
            priceFilter: document.getElementById('priceFilter'),
            searchInput: document.getElementById('searchInput'),
            
            modalOverlay: document.getElementById('modalOverlay'),
            openModal: document.getElementById('openModal'),
            closeModal: document.getElementById('closeModal'),
            cancelBtn: document.getElementById('cancelBtn'),
            shopForm: document.getElementById('shopForm'),
            
            shopUrl: document.getElementById('shopUrl'),
            fetchBtn: document.getElementById('fetchBtn'),
            previewCard: document.getElementById('previewCard'),
            previewImage: document.getElementById('previewImage'),
            previewTitle: document.getElementById('previewTitle'),
            previewUrl: document.getElementById('previewUrl'),
            shopName: document.getElementById('shopName'),
            shopCategory: document.getElementById('shopCategory'),
            shopArea: document.getElementById('shopArea'),
            shopPrice: document.getElementById('shopPrice'),
            shopImage: document.getElementById('shopImage'),
            shopDescription: document.getElementById('shopDescription'),
            
            settingsOverlay: document.getElementById('settingsOverlay'),
            openSettings: document.getElementById('openSettings'),
            closeSettings: document.getElementById('closeSettings'),
            cancelSettings: document.getElementById('cancelSettings'),
            gasUrl: document.getElementById('gasUrl'),
            settingsStatus: document.getElementById('settingsStatus'),
            testConnection: document.getElementById('testConnection'),
            runSetup: document.getElementById('runSetup'),
            copyGasCode: document.getElementById('copyGasCode'),
            resetSettings: document.getElementById('resetSettings'),
            
            setupNotice: document.getElementById('setupNotice'),
            setupNoticeBtn: document.getElementById('setupNoticeBtn'),
            
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    // セットアップ通知の表示/非表示
    showSetupNotice(show) {
        if (this.elements.setupNotice) {
            this.elements.setupNotice.style.display = show ? 'block' : 'none';
        }
    }

    renderShops(shops) {
        this.elements.shopCount.textContent = shops.length;
        
        if (shops.length === 0) {
            this.elements.shopsGrid.innerHTML = '';
            this.elements.noResults.style.display = 'block';
            return;
        }
        
        this.elements.noResults.style.display = 'none';
        
        this.elements.shopsGrid.innerHTML = shops.map(shop => `
            <article class="shop-card" onclick="window.open('${this.escapeHtml(shop.url)}', '_blank')">
                <img 
                    src="${this.escapeHtml(shop.image) || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                    alt="${this.escapeHtml(shop.name)}" 
                    class="shop-image"
                    onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'"
                >
                <div class="shop-content">
                    <span class="shop-category">${CATEGORIES[shop.category] || shop.category}</span>
                    <h3 class="shop-name">${this.escapeHtml(shop.name)}</h3>
                    ${shop.description ? `<p class="shop-description">${this.escapeHtml(shop.description)}</p>` : ''}
                    <div class="shop-meta">
                        <span class="shop-meta-item">${this.escapeHtml(shop.area)}</span>
                        <span class="shop-meta-item">${PRICE_RANGES[shop.price] || shop.price}</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    updateAreaFilter(shops) {
        const areas = [...new Set(shops.map(shop => shop.area))].filter(Boolean).sort();
        
        this.elements.areaFilter.innerHTML = '<option value="all">すべてのエリア</option>';
        areas.forEach(area => {
            this.elements.areaFilter.innerHTML += `<option value="${area}">${area}</option>`;
        });
    }

    showLoading(show) {
        this.elements.loading.style.display = show ? 'block' : 'none';
        if (show) {
            this.elements.shopsGrid.innerHTML = '';
            this.elements.noResults.style.display = 'none';
        }
    }

    updateConnectionStatus(status, message) {
        const statusClass = {
            'connected': 'status-connected',
            'demo': 'status-demo',
            'error': 'status-error'
        };
        
        this.elements.settingsStatus.innerHTML = `
            <span class="status-indicator ${statusClass[status] || 'status-demo'}"></span>
            <span>${message}</span>
        `;
    }

    openShopModal() {
        // セットアップが完了していない場合は警告
        if (!config.isSetupComplete()) {
            this.showToast('先に設定画面でスプレッドシートを設定してください', 'error');
            this.openSettingsModal();
            return;
        }
        
        this.elements.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.elements.shopUrl.focus();
    }

    closeShopModal() {
        this.elements.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.resetShopForm();
    }

    resetShopForm() {
        this.elements.shopForm.reset();
        this.elements.previewCard.style.display = 'none';
    }

    openSettingsModal() {
        const settings = config.getAll();
        this.elements.gasUrl.value = settings.gasUrl || '';
        
        if (settings.isSetupComplete && settings.gasUrl) {
            this.updateConnectionStatus('connected', '接続済み');
        } else {
            this.updateConnectionStatus('demo', '未設定（デモモード）');
        }
        
        this.elements.settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSettingsModal() {
        this.elements.settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    showPreview(data) {
        this.elements.previewCard.style.display = 'flex';
        this.elements.previewImage.src = data.image || 'https://via.placeholder.com/60?text=No+Image';
        this.elements.previewTitle.textContent = data.title || 'タイトル未取得';
        this.elements.previewUrl.textContent = data.url || '';
    }

    showToast(message, type = 'success') {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.className = `toast ${type === 'error' ? 'error' : ''} show`;
        
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }

    setFetchButtonLoading(loading) {
        this.elements.fetchBtn.disabled = loading;
        this.elements.fetchBtn.textContent = loading ? '取得中...' : '情報取得';
    }

    setSubmitButtonLoading(loading) {
        const btn = this.elements.shopForm.querySelector('.btn-submit');
        btn.disabled = loading;
        btn.textContent = loading ? '登録中...' : '登録する';
    }

    setSetupButtonLoading(loading) {
        this.elements.runSetup.disabled = loading;
        this.elements.runSetup.textContent = loading ? 'セットアップ中...' : '初回セットアップを実行';
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    }
}

const ui = new UI();

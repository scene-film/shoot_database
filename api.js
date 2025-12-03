// ===========================
// api.js - API通信処理（GAS専用）
// ===========================

class BentoAPI {
    constructor() {
        // ローカルストレージはデモ用のみ
        this.localStorageKey = 'bentoNaviShops';
    }

    // GAS URLが設定されているか確認
    hasGasUrl() {
        return !!config.get('gasUrl');
    }

    // ===========================
    // 初回セットアップ
    // ===========================

    async setup(gasUrl) {
        if (!gasUrl) {
            throw new Error('GAS URLを入力してください');
        }

        try {
            const url = `${gasUrl}?action=setup`;
            const response = await fetch(url, { method: 'POST' });
            
            if (!response.ok) {
                throw new Error('セットアップに失敗しました');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'セットアップに失敗しました');
            }
            
            // 設定を保存
            config.save({ 
                gasUrl: gasUrl,
                isSetupComplete: true
            });
            
            return data;
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    }

    // ===========================
    // データ取得
    // ===========================

    async getShops() {
        // GAS URLが設定されていない場合はデモデータ
        if (!this.hasGasUrl()) {
            return this.getDemoData();
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=getShops`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'データの取得に失敗しました');
            }
            
            return data.shops || [];
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // ===========================
    // データ追加
    // ===========================

    async addShop(shopData) {
        const newShop = {
            id: Date.now().toString(),
            url: shopData.url || '',
            name: shopData.name || '',
            category: shopData.category || '',
            area: shopData.area || '',
            price: shopData.price || '',
            image: shopData.image || '',
            description: shopData.description || '',
            createdAt: new Date().toISOString()
        };

        // GAS URLが設定されていない場合はエラー
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません。設定画面から初回セットアップを行ってください。');
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=addShop`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newShop)
            });
            
            if (!response.ok) {
                throw new Error('登録に失敗しました');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '登録に失敗しました');
            }
            
            return data.shop || newShop;
        } catch (error) {
            console.error('Add error:', error);
            throw error;
        }
    }

    // ===========================
    // データ削除
    // ===========================

    async deleteShop(shopId) {
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません');
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=deleteShop`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: shopId })
            });
            
            if (!response.ok) {
                throw new Error('削除に失敗しました');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '削除に失敗しました');
            }
            
            return data;
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }

    // ===========================
    // 接続テスト
    // ===========================

    async testConnection(gasUrl) {
        if (!gasUrl) {
            return { success: false, error: 'GAS URLを入力してください' };
        }

        try {
            const url = `${gasUrl}?action=getShops`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('接続できませんでした');
            }
            
            const data = await response.json();
            
            if (data.success === false) {
                throw new Error(data.error || '接続エラー');
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================
    // OGP取得
    // ===========================

    async fetchOGP(url) {
        const proxyUrl = config.get('ogpProxy') + encodeURIComponent(url);
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error('情報の取得に失敗しました');
        }
        
        const data = await response.json();
        const html = data.contents;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const getMetaContent = (property) => {
            const meta = doc.querySelector(`meta[property="${property}"]`) ||
                         doc.querySelector(`meta[name="${property}"]`);
            return meta ? meta.getAttribute('content') : null;
        };
        
        return {
            title: getMetaContent('og:title') || doc.querySelector('title')?.textContent || null,
            description: getMetaContent('og:description') || getMetaContent('description') || null,
            image: getMetaContent('og:image') || null
        };
    }

    // ===========================
    // デモ用データ
    // ===========================

    getDemoData() {
        return [
            {
                id: 'demo1',
                url: 'https://example.com/bento1',
                name: 'おにぎり専門店 むすび',
                category: 'onigiri',
                area: '渋谷区',
                price: 'under500',
                image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop',
                description: '手作りおにぎりが自慢のお店。',
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo2',
                url: 'https://example.com/bento2',
                name: '焼肉弁当 肉匠',
                category: 'meat',
                area: '新宿区',
                price: '800to1000',
                image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
                description: '厳選された国産牛を使用。',
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo3',
                url: 'https://example.com/bento3',
                name: '中華厨房 龍園',
                category: 'chinese',
                area: '港区',
                price: '500to800',
                image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
                description: '本格中華を手軽にお弁当で。',
                createdAt: new Date().toISOString()
            }
        ];
    }
}

const api = new BentoAPI();

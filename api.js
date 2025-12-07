// ===========================
// api.js - API通信処理（GAS専用）
// ===========================

class BentoAPI {
    constructor() {
        this.localStorageKey = 'bentoNaviShops';
        // 複数のCORSプロキシを用意（フォールバック用）
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
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
            // GASへはGETリクエストが安定
            const url = `${gasUrl}?action=setup&t=${Date.now()}`;
            const response = await fetch(url, { 
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Response parse error:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
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

    // 全データを一括取得（高速化）
    async getAll() {
        if (!this.hasGasUrl()) {
            return {
                shops: [],
                categories: Object.entries(DEFAULT_CATEGORIES).map(([id, name]) => ({ id, name, isDefault: true })),
                areas: Object.entries(DEFAULT_AREAS).map(([id, name]) => ({ id, name, isDefault: true }))
            };
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=getAll&t=${Date.now()}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'データの取得に失敗しました');
            }
            
            return {
                shops: data.shops || [],
                categories: data.categories || [],
                areas: data.areas || []
            };
        } catch (error) {
            console.error('GetAll error:', error);
            throw error;
        }
    }

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

        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません。設定画面からセットアップを行ってください。');
        }

        try {
            const gasUrl = config.get('gasUrl');
            // データをBase64エンコードしてGETパラメータで送信
            const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(newShop))));
            const url = `${gasUrl}?action=addShop&data=${encodeURIComponent(encodedData)}&t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Response parse error:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
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
            const url = `${gasUrl}?action=deleteShop&id=${encodeURIComponent(shopId)}&t=${Date.now()}`;
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('レスポンスの解析に失敗しました');
            }
            
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
    // データ更新
    // ===========================

    async updateShop(shopData) {
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません');
        }

        try {
            const gasUrl = config.get('gasUrl');
            const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(shopData))));
            const url = `${gasUrl}?action=updateShop&data=${encodeURIComponent(encodedData)}&t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Response parse error:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || '更新に失敗しました');
            }
            
            return data;
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }

    // ===========================
    // カテゴリ取得
    // ===========================

    async getCategories() {
        if (!this.hasGasUrl()) {
            // デモモード時はデフォルトカテゴリを返す
            return Object.entries(DEFAULT_CATEGORIES).map(([id, name]) => ({
                id,
                name,
                isDefault: true
            }));
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=getCategories`;
            const response = await fetch(url);
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Response parse error:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'カテゴリの取得に失敗しました');
            }
            
            return data.categories || [];
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    }

    // ===========================
    // カテゴリ追加
    // ===========================

    async addCategory(name) {
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません');
        }

        const catId = 'cat_' + Date.now();

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=addCategory&id=${encodeURIComponent(catId)}&name=${encodeURIComponent(name)}&t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Response parse error:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'カテゴリの追加に失敗しました');
            }
            
            return data.category;
        } catch (error) {
            console.error('Add category error:', error);
            throw error;
        }
    }

    // ===========================
    // カテゴリ削除
    // ===========================

    async deleteCategory(catId) {
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません');
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=deleteCategory&id=${encodeURIComponent(catId)}&t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Response parse error:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'カテゴリの削除に失敗しました');
            }
            
            return data;
        } catch (error) {
            console.error('Delete category error:', error);
            throw error;
        }
    }

    // ===========================
    // エリア取得
    // ===========================

    async getAreas() {
        if (!this.hasGasUrl()) {
            return Object.entries(DEFAULT_AREAS).map(([id, name]) => ({
                id,
                name,
                isDefault: true
            }));
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=getAreas&t=${Date.now()}`;
            const response = await fetch(url);
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'エリアの取得に失敗しました');
            }
            
            return data.areas || [];
        } catch (error) {
            console.error('Get areas error:', error);
            throw error;
        }
    }

    // ===========================
    // エリア追加
    // ===========================

    async addArea(name) {
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません');
        }

        const areaId = 'area_' + Date.now();

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=addArea&id=${encodeURIComponent(areaId)}&name=${encodeURIComponent(name)}&t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'エリアの追加に失敗しました');
            }
            
            return data.area;
        } catch (error) {
            console.error('Add area error:', error);
            throw error;
        }
    }

    // ===========================
    // エリア削除
    // ===========================

    async deleteArea(areaId) {
        if (!this.hasGasUrl()) {
            throw new Error('スプレッドシートが設定されていません');
        }

        try {
            const gasUrl = config.get('gasUrl');
            const url = `${gasUrl}?action=deleteArea&id=${encodeURIComponent(areaId)}&t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'エリアの削除に失敗しました');
            }
            
            return data;
        } catch (error) {
            console.error('Delete area error:', error);
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
    // OGP取得（複数プロキシ対応）
    // ===========================

    async fetchOGP(url) {
        let lastError = null;
        
        // 各プロキシを順番に試行
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxy = this.corsProxies[i];
            try {
                console.log(`Trying proxy ${i + 1}/${this.corsProxies.length}: ${proxy.substring(0, 30)}...`);
                const result = await this.tryFetchWithProxy(proxy, url);
                if (result && result.title) {
                    return result;
                }
            } catch (error) {
                lastError = error;
                console.log(`Proxy ${i + 1} failed:`, error.message);
            }
        }
        
        // 全プロキシ失敗時はURLからタイトルを推測
        console.log('All proxies failed, extracting from URL');
        return this.extractFromUrl(url);
    }

    async tryFetchWithProxy(proxy, targetUrl) {
        const proxyUrl = proxy + encodeURIComponent(targetUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒に延長
        
        try {
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const html = await response.text();
            
            if (!html || html.length < 100) {
                throw new Error('Empty response');
            }
            
            return this.parseOGP(html, targetUrl);
        } catch (error) {
            clearTimeout(timeoutId);
            // タイムアウトエラーの場合は次のプロキシを試す
            if (error.name === 'AbortError') {
                throw new Error('Timeout');
            }
            throw error;
        }
    }

    parseOGP(html, sourceUrl) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const getMetaContent = (...properties) => {
            for (const prop of properties) {
                let meta = doc.querySelector(`meta[property="${prop}"]`);
                if (meta) return meta.getAttribute('content');
                
                meta = doc.querySelector(`meta[name="${prop}"]`);
                if (meta) return meta.getAttribute('content');
                
                meta = doc.querySelector(`meta[itemprop="${prop}"]`);
                if (meta) return meta.getAttribute('content');
            }
            return null;
        };
        
        // タイトル取得
        let title = getMetaContent('og:title', 'twitter:title', 'title');
        if (!title) {
            const titleTag = doc.querySelector('title');
            title = titleTag ? titleTag.textContent.trim() : null;
        }
        if (!title) {
            const h1 = doc.querySelector('h1');
            title = h1 ? h1.textContent.trim() : null;
        }
        
        // 説明取得
        let description = getMetaContent('og:description', 'twitter:description', 'description');
        
        // 画像取得（優先順位付きで複数ソースを試行）
        let image = null;
        
        // 1. OGP/Twitter画像
        image = getMetaContent('og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src');
        
        // 2. Schema.org画像
        if (!image) {
            const schemaImage = doc.querySelector('[itemprop="image"]');
            if (schemaImage) {
                image = schemaImage.getAttribute('content') || schemaImage.getAttribute('src') || schemaImage.getAttribute('href');
            }
        }
        
        // 3. Apple Touch Icon（高解像度）
        if (!image) {
            const appleIcon = doc.querySelector('link[rel="apple-touch-icon"]') ||
                              doc.querySelector('link[rel="apple-touch-icon-precomposed"]');
            if (appleIcon) {
                image = appleIcon.getAttribute('href');
            }
        }
        
        // 4. 大きいfavicon
        if (!image) {
            const icons = doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
            let largestIcon = null;
            let largestSize = 0;
            
            icons.forEach(icon => {
                const sizes = icon.getAttribute('sizes');
                if (sizes) {
                    const size = parseInt(sizes.split('x')[0]) || 0;
                    if (size > largestSize) {
                        largestSize = size;
                        largestIcon = icon.getAttribute('href');
                    }
                } else if (!largestIcon) {
                    largestIcon = icon.getAttribute('href');
                }
            });
            
            if (largestIcon) {
                image = largestIcon;
            }
        }
        
        // 5. ページ内の最初の大きな画像
        if (!image) {
            const imgs = doc.querySelectorAll('img[src]');
            for (const img of imgs) {
                const src = img.getAttribute('src');
                const width = parseInt(img.getAttribute('width')) || 0;
                const height = parseInt(img.getAttribute('height')) || 0;
                
                // ロゴやヘッダー画像の可能性が高いものを優先
                const alt = (img.getAttribute('alt') || '').toLowerCase();
                const className = (img.getAttribute('class') || '').toLowerCase();
                
                if (alt.includes('logo') || className.includes('logo') || 
                    alt.includes('header') || className.includes('header') ||
                    (width >= 100 && height >= 100)) {
                    image = src;
                    break;
                }
            }
        }
        
        // 6. 最後の手段：favicon.ico
        if (!image) {
            try {
                const baseUrl = new URL(sourceUrl);
                image = baseUrl.origin + '/favicon.ico';
            } catch (e) {}
        }
        
        // 相対URLを絶対URLに変換
        if (image && !image.startsWith('http') && !image.startsWith('data:')) {
            try {
                const baseUrl = new URL(sourceUrl);
                if (image.startsWith('//')) {
                    image = baseUrl.protocol + image;
                } else if (image.startsWith('/')) {
                    image = baseUrl.origin + image;
                } else {
                    image = baseUrl.origin + '/' + image;
                }
            } catch (e) {}
        }
        
        return {
            title: title || null,
            description: description || null,
            image: image || null
        };
    }

    // URLからタイトルを推測（フォールバック）
    extractFromUrl(url) {
        try {
            const urlObj = new URL(url);
            let title = urlObj.hostname.replace('www.', '');
            const parts = title.split('.');
            if (parts.length > 0) {
                title = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
            
            return {
                title: title,
                description: null,
                image: null
            };
        } catch (e) {
            return { title: null, description: null, image: null };
        }
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

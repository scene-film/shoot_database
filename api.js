// ===========================
// api.js - API通信
// ===========================

class LokeNaviAPI {
    hasGasUrl() {
        return !!config.get('gasUrl');
    }

    async setup(gasUrl) {
        if (!gasUrl) throw new Error('GAS URLを入力してください');
        
        const url = `${gasUrl}?action=setup&t=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const data = await response.json();
        
        if (!data.success) throw new Error(data.error || 'セットアップ失敗');
        
        config.save({ gasUrl, isSetupComplete: true });
        return data;
    }

    async getAll() {
        if (!this.hasGasUrl()) {
            return {
                bentoShops: [],
                locations: [],
                bentoCategories: Object.entries(DEFAULT_BENTO_CATEGORIES).map(([id, name]) => ({ id, name, isDefault: true })),
                bentoAreas: Object.entries(DEFAULT_BENTO_AREAS).map(([id, name]) => ({ id, name, isDefault: true })),
                locationCategories: Object.entries(DEFAULT_LOCATION_CATEGORIES).map(([id, name]) => ({ id, name, isDefault: true })),
                locationAreas: Object.entries(DEFAULT_LOCATION_AREAS).map(([id, name]) => ({ id, name, isDefault: true }))
            };
        }
        
        const gasUrl = config.get('gasUrl');
        const response = await fetch(`${gasUrl}?action=getAll&t=${Date.now()}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data;
    }

    // 弁当関連
    async addBentoShop(shopData) {
        return this._addItem('addBentoShop', shopData);
    }
    
    async updateBentoShop(shopData) {
        return this._updateItem('updateBentoShop', shopData);
    }
    
    async deleteBentoShop(id) {
        return this._deleteItem('deleteBentoShop', id);
    }
    
    async addBentoCategory(name) {
        return this._addCategory('addBentoCategory', name);
    }
    
    async deleteBentoCategory(id) {
        return this._deleteCategory('deleteBentoCategory', id);
    }
    
    async addBentoArea(name) {
        return this._addCategory('addBentoArea', name);
    }
    
    async deleteBentoArea(id) {
        return this._deleteCategory('deleteBentoArea', id);
    }

    // ロケ地関連
    async addLocation(locationData) {
        return this._addItem('addLocation', locationData);
    }
    
    async updateLocation(locationData) {
        return this._updateItem('updateLocation', locationData);
    }
    
    async deleteLocation(id) {
        return this._deleteItem('deleteLocation', id);
    }
    
    async addLocationCategory(name) {
        return this._addCategory('addLocationCategory', name);
    }
    
    async deleteLocationCategory(id) {
        return this._deleteCategory('deleteLocationCategory', id);
    }
    
    async addLocationArea(name) {
        return this._addCategory('addLocationArea', name);
    }
    
    async deleteLocationArea(id) {
        return this._deleteCategory('deleteLocationArea', id);
    }

    // 共通メソッド
    async _addItem(action, itemData) {
        if (!this.hasGasUrl()) throw new Error('スプレッドシートが設定されていません');
        
        const data = { ...itemData, id: Date.now().toString(), createdAt: new Date().toISOString() };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        const url = `${config.get('gasUrl')}?action=${action}&data=${encodeURIComponent(encoded)}&t=${Date.now()}`;
        
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result;
    }
    
    async _updateItem(action, itemData) {
        if (!this.hasGasUrl()) throw new Error('スプレッドシートが設定されていません');
        
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(itemData))));
        const url = `${config.get('gasUrl')}?action=${action}&data=${encodeURIComponent(encoded)}&t=${Date.now()}`;
        
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result;
    }
    
    async _deleteItem(action, id) {
        if (!this.hasGasUrl()) throw new Error('スプレッドシートが設定されていません');
        
        const url = `${config.get('gasUrl')}?action=${action}&id=${encodeURIComponent(id)}&t=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result;
    }
    
    async _addCategory(action, name) {
        if (!this.hasGasUrl()) throw new Error('スプレッドシートが設定されていません');
        
        const id = 'cat_' + Date.now();
        const url = `${config.get('gasUrl')}?action=${action}&id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&t=${Date.now()}`;
        
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result;
    }
    
    async _deleteCategory(action, id) {
        if (!this.hasGasUrl()) throw new Error('スプレッドシートが設定されていません');
        
        const url = `${config.get('gasUrl')}?action=${action}&id=${encodeURIComponent(id)}&t=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result;
    }

    async testConnection(gasUrl) {
        if (!gasUrl) return { success: false, error: 'URLを入力してください' };
        
        try {
            const response = await fetch(`${gasUrl}?action=getAll&t=${Date.now()}`);
            const data = await response.json();
            return { success: data.success };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // OGP取得（複数プロキシ対応）
    async fetchOgp(url) {
        const proxies = [
            (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
            (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
        ];
        
        let html = '';
        
        for (const proxy of proxies) {
            try {
                const proxyUrl = proxy(url);
                const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
                
                if (proxyUrl.includes('allorigins')) {
                    const data = await response.json();
                    if (data.contents) {
                        html = data.contents;
                        break;
                    }
                } else {
                    const text = await response.text();
                    if (text && text.includes('<')) {
                        html = text;
                        break;
                    }
                }
            } catch (e) {
                console.log('Proxy failed:', e.message);
                continue;
            }
        }
        
        if (!html) return {};
        
        const getMetaContent = (property) => {
            const patterns = [
                new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
                new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
            ];
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match) return match[1];
            }
            return null;
        };
        
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        
        // 画像取得（優先順位: og:image > twitter:image > 最初の大きな画像 > logo > favicon）
        let image = getMetaContent('og:image') || getMetaContent('twitter:image');
        
        if (!image) {
            // コンテンツ内の画像を探す（小さいアイコンを除外）
            const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
            for (const match of imgMatches) {
                const src = match[1];
                // 小さいアイコンや追跡ピクセルを除外
                if (!src.includes('icon') && !src.includes('logo') && !src.includes('pixel') && 
                    !src.includes('tracking') && !src.includes('1x1') && !src.includes('spacer')) {
                    image = src;
                    break;
                }
            }
        }
        
        if (!image) {
            // ロゴやfaviconを探す
            const logoMatch = html.match(/<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
                || html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*logo/i)
                || html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i)
                || html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i)
                || html.match(/<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i);
            
            if (logoMatch) image = logoMatch[1];
        }
        
        // 相対パスを絶対パスに変換
        if (image && !image.startsWith('http') && !image.startsWith('data:')) {
            try {
                const urlObj = new URL(url);
                if (image.startsWith('//')) {
                    image = urlObj.protocol + image;
                } else if (image.startsWith('/')) {
                    image = urlObj.origin + image;
                } else {
                    image = urlObj.origin + '/' + image;
                }
            } catch (e) {}
        }
        
        return {
            title: getMetaContent('og:title') || (titleMatch ? titleMatch[1].trim() : ''),
            description: getMetaContent('og:description') || getMetaContent('description') || '',
            image: image || ''
        };
    }
}

const api = new LokeNaviAPI();

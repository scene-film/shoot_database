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

    // OGP取得
    async fetchOgp(url) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (!data.contents) return {};
            
            const html = data.contents;
            const getMetaContent = (property) => {
                const match = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
                    || html.match(new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
                return match ? match[1] : null;
            };
            
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            
            return {
                title: getMetaContent('og:title') || (titleMatch ? titleMatch[1] : ''),
                description: getMetaContent('og:description') || getMetaContent('description') || '',
                image: getMetaContent('og:image') || ''
            };
        } catch (e) {
            console.error('OGP fetch error:', e);
            return {};
        }
    }
}

const api = new LokeNaviAPI();

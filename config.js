// ===========================
// config.js - 設定管理
// ===========================

// デフォルトカテゴリ（初期表示用・フォールバック用）
const DEFAULT_CATEGORIES = {
    onigiri: 'おにぎり・サンド',
    meat: '肉・魚',
    chinese: '中華',
    curry: 'カレー',
    noodle: '麺類',
    catering: 'ケータリング',
    other: 'その他'
};

// カテゴリマッピング（動的に更新される）
let CATEGORIES = { all: 'すべて', ...DEFAULT_CATEGORIES };

// 価格帯マッピング
const PRICE_RANGES = {
    under500: '〜500円',
    '500to800': '500〜800円',
    '800to1000': '800〜1,000円',
    over1000: '1,000円〜'
};

// デフォルト設定
const DEFAULT_CONFIG = {
    gasUrl: '',
    isSetupComplete: false,
    ogpProxy: 'https://api.allorigins.win/get?url='
};

// 設定クラス
class Config {
    constructor() {
        this.settings = this.load();
        this.categoriesLoaded = false;
    }

    load() {
        const saved = localStorage.getItem('bentoNaviConfig');
        if (saved) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
        return { ...DEFAULT_CONFIG };
    }

    save(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('bentoNaviConfig', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key];
    }

    getAll() {
        return { ...this.settings };
    }

    isReady() {
        return this.settings.isSetupComplete && this.settings.gasUrl;
    }

    markSetupComplete() {
        this.save({ isSetupComplete: true });
    }

    reset() {
        localStorage.removeItem('bentoNaviConfig');
        this.settings = { ...DEFAULT_CONFIG };
        CATEGORIES = { all: 'すべて', ...DEFAULT_CATEGORIES };
    }

    updateCategories(categoriesArray) {
        CATEGORIES = { all: 'すべて' };
        categoriesArray.forEach(cat => {
            CATEGORIES[cat.id] = cat.name;
        });
        this.categoriesLoaded = true;
    }

    getAllCategoriesWithoutAll() {
        const cats = { ...CATEGORIES };
        delete cats.all;
        return cats;
    }
}

// Google Apps Script コード
const GAS_CODE = `// ===========================
// Google Apps Script - 弁当ナビ
// ===========================
// 
// 【セットアップ手順】
// 1. このコードをApps Scriptエディタに貼り付け
// 2. 「デプロイ」→「新しいデプロイ」
// 3. 種類：「ウェブアプリ」
// 4. 実行ユーザー：「自分」
// 5. アクセスできるユーザー：「全員」
// 6. デプロイしてURLを取得
// 7. サイトの設定画面にURLを入力して「セットアップを実行」

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'setup':
        return setup();
      case 'getShops':
        return getShops();
      case 'addShop':
        return addShop(e);
      case 'deleteShop':
        return deleteShop(e);
      case 'getCategories':
        return getCategories();
      case 'addCategory':
        return addCategory(e);
      case 'deleteCategory':
        return deleteCategory(e);
      default:
        return createResponse({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

// セットアップ
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // shopsシート
  let shopsSheet = ss.getSheetByName('shops');
  if (!shopsSheet) {
    shopsSheet = ss.insertSheet('shops');
  }
  
  const firstRow = shopsSheet.getRange(1, 1, 1, 9).getValues()[0];
  if (firstRow[0] !== 'id') {
    const headers = ['id', 'url', 'name', 'category', 'area', 'price', 'image', 'description', 'createdAt'];
    const headerRange = shopsSheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#333333');
    headerRange.setFontColor('#FFFFFF');
    shopsSheet.setFrozenRows(1);
  }
  
  // categoriesシート
  let catSheet = ss.getSheetByName('categories');
  if (!catSheet) {
    catSheet = ss.insertSheet('categories');
  }
  
  const catFirstRow = catSheet.getRange(1, 1, 1, 4).getValues()[0];
  if (catFirstRow[0] !== 'id') {
    const catHeaders = ['id', 'name', 'isDefault', 'createdAt'];
    const catHeaderRange = catSheet.getRange(1, 1, 1, catHeaders.length);
    catHeaderRange.setValues([catHeaders]);
    catHeaderRange.setFontWeight('bold');
    catHeaderRange.setBackground('#333333');
    catHeaderRange.setFontColor('#FFFFFF');
    catSheet.setFrozenRows(1);
    
    // デフォルトカテゴリ
    const defaultCats = [
      ['onigiri', 'おにぎり・サンド', true, new Date().toISOString()],
      ['meat', '肉・魚', true, new Date().toISOString()],
      ['chinese', '中華', true, new Date().toISOString()],
      ['curry', 'カレー', true, new Date().toISOString()],
      ['noodle', '麺類', true, new Date().toISOString()],
      ['catering', 'ケータリング', true, new Date().toISOString()],
      ['other', 'その他', true, new Date().toISOString()]
    ];
    catSheet.getRange(2, 1, defaultCats.length, 4).setValues(defaultCats);
  }
  
  return createResponse({ success: true, message: 'セットアップ完了' });
}

// お店一覧取得
function getShops() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('shops');
  
  if (!sheet) return createResponse({ success: true, shops: [] });
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createResponse({ success: true, shops: [] });
  
  const data = sheet.getRange(1, 1, lastRow, 9).getValues();
  const headers = data[0];
  const shops = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    const shop = {};
    headers.forEach((h, idx) => shop[h] = row[idx] || '');
    shops.push(shop);
  }
  
  return createResponse({ success: true, shops: shops });
}

// お店追加
function addShop(e) {
  let data;
  if (e.parameter.data) {
    const decoded = Utilities.newBlob(Utilities.base64Decode(e.parameter.data)).getDataAsString('UTF-8');
    data = JSON.parse(decoded);
  } else if (e.postData && e.postData.contents) {
    data = JSON.parse(e.postData.contents);
  } else {
    return createResponse({ success: false, error: 'データがありません' });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('shops');
  if (!sheet) { setup(); sheet = ss.getSheetByName('shops'); }
  
  const newRow = [
    data.id || Date.now().toString(),
    data.url || '',
    data.name || '',
    data.category || '',
    data.area || '',
    data.price || '',
    data.image || '',
    data.description || '',
    data.createdAt || new Date().toISOString()
  ];
  
  sheet.appendRow(newRow);
  
  return createResponse({ success: true, shop: { id: newRow[0], name: newRow[2] } });
}

// お店削除
function deleteShop(e) {
  const shopId = e.parameter.id;
  if (!shopId) return createResponse({ success: false, error: 'IDが必要です' });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('shops');
  if (!sheet) return createResponse({ success: false, error: 'シートがありません' });
  
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(1, 1, lastRow, 1).getValues();
  
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === shopId.toString()) {
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  
  return createResponse({ success: false, error: '見つかりません' });
}

// カテゴリ一覧取得
function getCategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('categories');
  
  if (!sheet) return createResponse({ success: true, categories: [] });
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createResponse({ success: true, categories: [] });
  
  const data = sheet.getRange(1, 1, lastRow, 4).getValues();
  const categories = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    categories.push({
      id: row[0],
      name: row[1],
      isDefault: row[2] === true || row[2] === 'true',
      createdAt: row[3]
    });
  }
  
  return createResponse({ success: true, categories: categories });
}

// カテゴリ追加
function addCategory(e) {
  const catId = e.parameter.id || 'cat_' + Date.now();
  const catName = e.parameter.name;
  
  if (!catName) return createResponse({ success: false, error: '名前が必要です' });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('categories');
  if (!sheet) { setup(); sheet = ss.getSheetByName('categories'); }
  
  sheet.appendRow([catId, catName, false, new Date().toISOString()]);
  
  return createResponse({ success: true, category: { id: catId, name: catName, isDefault: false } });
}

// カテゴリ削除
function deleteCategory(e) {
  const catId = e.parameter.id;
  if (!catId) return createResponse({ success: false, error: 'IDが必要です' });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('categories');
  if (!sheet) return createResponse({ success: false, error: 'シートがありません' });
  
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(1, 1, lastRow, 3).getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === catId.toString()) {
      if (values[i][2] === true || values[i][2] === 'true') {
        return createResponse({ success: false, error: 'デフォルトは削除不可' });
      }
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  
  return createResponse({ success: false, error: '見つかりません' });
}

// レスポンス生成
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

// グローバルインスタンス
const config = new Config();

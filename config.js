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

    // 初回セットアップが完了しているか
    isReady() {
        return this.settings.isSetupComplete && this.settings.gasUrl;
    }

    // セットアップ完了をマーク
    markSetupComplete() {
        this.save({ isSetupComplete: true });
    }

    // 設定をリセット
    reset() {
        localStorage.removeItem('bentoNaviConfig');
        this.settings = { ...DEFAULT_CONFIG };
        CATEGORIES = { all: 'すべて', ...DEFAULT_CATEGORIES };
    }

    // カテゴリを更新（スプレッドシートから取得したデータで）
    updateCategories(categoriesArray) {
        CATEGORIES = { all: 'すべて' };
        categoriesArray.forEach(cat => {
            CATEGORIES[cat.id] = cat.name;
        });
        this.categoriesLoaded = true;
    }

    // 全カテゴリ取得（allを除く）
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
// 7. サイトの設定画面にURLを入力して「初回セットアップ」

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

// 初回セットアップ - シートとヘッダーを作成
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const spreadsheetId = ss.getId();
  const spreadsheetUrl = ss.getUrl();
  
  // shopsシートを作成または取得
  let shopsSheet = ss.getSheetByName('shops');
  if (!shopsSheet) {
    shopsSheet = ss.insertSheet('shops');
  }
  
  // shopsヘッダー確認・設定
  const firstRow = shopsSheet.getRange(1, 1, 1, 9).getValues()[0];
  if (firstRow[0] !== 'id') {
    const headers = ['id', 'url', 'name', 'category', 'area', 'price', 'image', 'description', 'createdAt'];
    const headerRange = shopsSheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#333333');
    headerRange.setFontColor('#FFFFFF');
    
    shopsSheet.setColumnWidth(1, 140);
    shopsSheet.setColumnWidth(2, 250);
    shopsSheet.setColumnWidth(3, 180);
    shopsSheet.setColumnWidth(4, 120);
    shopsSheet.setColumnWidth(5, 120);
    shopsSheet.setColumnWidth(6, 100);
    shopsSheet.setColumnWidth(7, 250);
    shopsSheet.setColumnWidth(8, 300);
    shopsSheet.setColumnWidth(9, 160);
    shopsSheet.setFrozenRows(1);
  }
  
  // categoriesシートを作成または取得
  let catSheet = ss.getSheetByName('categories');
  if (!catSheet) {
    catSheet = ss.insertSheet('categories');
  }
  
  // categoriesヘッダー確認・設定
  const catFirstRow = catSheet.getRange(1, 1, 1, 4).getValues()[0];
  if (catFirstRow[0] !== 'id') {
    const catHeaders = ['id', 'name', 'isDefault', 'createdAt'];
    const catHeaderRange = catSheet.getRange(1, 1, 1, catHeaders.length);
    catHeaderRange.setValues([catHeaders]);
    catHeaderRange.setFontWeight('bold');
    catHeaderRange.setBackground('#333333');
    catHeaderRange.setFontColor('#FFFFFF');
    
    catSheet.setColumnWidth(1, 140);
    catSheet.setColumnWidth(2, 180);
    catSheet.setColumnWidth(3, 80);
    catSheet.setColumnWidth(4, 160);
    catSheet.setFrozenRows(1);
    
    // デフォルトカテゴリを追加
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
  
  return createResponse({ 
    success: true, 
    message: 'セットアップが完了しました',
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheetUrl
  });
}

// お店一覧を取得
function getShops() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('shops');
  
  if (!sheet) {
    return createResponse({ success: true, shops: [] });
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createResponse({ success: true, shops: [] });
  }
  
  const data = sheet.getRange(1, 1, lastRow, 9).getValues();
  const headers = data[0];
  const shops = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    
    const shop = {};
    headers.forEach((header, index) => {
      shop[header] = row[index] !== undefined ? row[index] : '';
    });
    shops.push(shop);
  }
  
  return createResponse({ success: true, shops: shops });
}

// お店を追加
function addShop(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('shops');
  
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName('shops');
  }
  
  const newId = data.id || Date.now().toString();
  const newRow = [
    newId,
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
  
  return createResponse({ 
    success: true, 
    message: 'お店を追加しました',
    shop: {
      id: newRow[0],
      url: newRow[1],
      name: newRow[2],
      category: newRow[3],
      area: newRow[4],
      price: newRow[5],
      image: newRow[6],
      description: newRow[7],
      createdAt: newRow[8]
    }
  });
}

// お店を削除
function deleteShop(e) {
  const data = JSON.parse(e.postData.contents);
  const shopId = data.id;
  
  if (!shopId) {
    return createResponse({ success: false, error: 'IDが指定されていません' });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('shops');
  
  if (!sheet) {
    return createResponse({ success: false, error: 'シートが見つかりません' });
  }
  
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(1, 1, lastRow, 1).getValues();
  
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === shopId.toString()) {
      sheet.deleteRow(i + 1);
      return createResponse({ success: true, message: 'お店を削除しました' });
    }
  }
  
  return createResponse({ success: false, error: '該当するお店が見つかりません' });
}

// カテゴリ一覧を取得
function getCategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('categories');
  
  if (!sheet) {
    return createResponse({ success: true, categories: [] });
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createResponse({ success: true, categories: [] });
  }
  
  const data = sheet.getRange(1, 1, lastRow, 4).getValues();
  const headers = data[0];
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

// カテゴリを追加
function addCategory(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('categories');
  
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName('categories');
  }
  
  const newRow = [
    data.id || 'cat_' + Date.now(),
    data.name || '',
    false,
    new Date().toISOString()
  ];
  
  sheet.appendRow(newRow);
  
  return createResponse({ 
    success: true, 
    category: { id: newRow[0], name: newRow[1], isDefault: false }
  });
}

// カテゴリを削除
function deleteCategory(e) {
  const data = JSON.parse(e.postData.contents);
  const catId = data.id;
  
  if (!catId) {
    return createResponse({ success: false, error: 'IDが指定されていません' });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('categories');
  
  if (!sheet) {
    return createResponse({ success: false, error: 'シートが見つかりません' });
  }
  
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(1, 1, lastRow, 3).getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === catId.toString()) {
      // デフォルトカテゴリは削除不可
      if (values[i][2] === true || values[i][2] === 'true') {
        return createResponse({ success: false, error: 'デフォルトカテゴリは削除できません' });
      }
      sheet.deleteRow(i + 1);
      return createResponse({ success: true, message: 'カテゴリを削除しました' });
    }
  }
  
  return createResponse({ success: false, error: '該当するカテゴリが見つかりません' });
}

// JSONレスポンスを作成
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

// グローバルインスタンス
const config = new Config();

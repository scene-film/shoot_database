// ===========================
// config.js - 設定管理
// ===========================

// デフォルトカテゴリ
const DEFAULT_CATEGORIES = {
    onigiri: 'おにぎり・サンド',
    meat: '肉・魚',
    chinese: '中華',
    curry: 'カレー',
    noodle: '麺類',
    catering: 'ケータリング',
    other: 'その他'
};

// デフォルトエリア
const DEFAULT_AREAS = {
    tokyo23: '東京23区',
    tokyoOther: '23区外',
    chiba: '千葉',
    kanagawa: '神奈川',
    saitama: '埼玉'
};

// カテゴリマッピング（動的に更新される）
let CATEGORIES = { all: 'すべて', ...DEFAULT_CATEGORIES };

// エリアマッピング（動的に更新される）
let AREAS = { all: 'すべてのエリア', ...DEFAULT_AREAS };

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
    isSetupComplete: false
};

// 設定クラス
class Config {
    constructor() {
        this.settings = this.load();
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

    reset() {
        localStorage.removeItem('bentoNaviConfig');
        this.settings = { ...DEFAULT_CONFIG };
        CATEGORIES = { all: 'すべて', ...DEFAULT_CATEGORIES };
        AREAS = { all: 'すべてのエリア', ...DEFAULT_AREAS };
    }

    updateCategories(categoriesArray) {
        CATEGORIES = { all: 'すべて' };
        categoriesArray.forEach(cat => {
            CATEGORIES[cat.id] = cat.name;
        });
    }

    updateAreas(areasArray) {
        AREAS = { all: 'すべてのエリア' };
        areasArray.forEach(area => {
            AREAS[area.id] = area.name;
        });
    }

    getAllCategoriesWithoutAll() {
        const cats = { ...CATEGORIES };
        delete cats.all;
        return cats;
    }

    getAllAreasWithoutAll() {
        const areas = { ...AREAS };
        delete areas.all;
        return areas;
    }
}

// Google Apps Script コード
const GAS_CODE = `// ===========================
// Google Apps Script - 弁当ナビ
// ===========================

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const action = e.parameter.action;
  try {
    switch(action) {
      case 'setup': return setup();
      case 'getAll': return getAll();
      case 'getShops': return getShops();
      case 'addShop': return addShop(e);
      case 'updateShop': return updateShop(e);
      case 'deleteShop': return deleteShop(e);
      case 'getCategories': return getCategories();
      case 'addCategory': return addCategory(e);
      case 'deleteCategory': return deleteCategory(e);
      case 'getAreas': return getAreas();
      case 'addArea': return addArea(e);
      case 'deleteArea': return deleteArea(e);
      default: return createResponse({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function getAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 店舗
  const shopsSheet = ss.getSheetByName('shops');
  let shops = [];
  if (shopsSheet && shopsSheet.getLastRow() > 1) {
    const data = shopsSheet.getRange(1, 1, shopsSheet.getLastRow(), 9).getValues();
    const headers = data[0];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const shop = {};
      headers.forEach((h, idx) => shop[h] = data[i][idx] || '');
      shops.push(shop);
    }
  }
  
  // カテゴリ
  const catSheet = ss.getSheetByName('categories');
  let categories = [];
  if (catSheet && catSheet.getLastRow() > 1) {
    const data = catSheet.getRange(2, 1, catSheet.getLastRow() - 1, 4).getValues();
    categories = data.filter(r => r[0]).map(r => ({
      id: r[0], name: r[1], isDefault: r[2] === true || r[2] === 'true'
    }));
  }
  
  // エリア
  const areaSheet = ss.getSheetByName('areas');
  let areas = [];
  if (areaSheet && areaSheet.getLastRow() > 1) {
    const data = areaSheet.getRange(2, 1, areaSheet.getLastRow() - 1, 4).getValues();
    areas = data.filter(r => r[0]).map(r => ({
      id: r[0], name: r[1], isDefault: r[2] === true || r[2] === 'true'
    }));
  }
  
  return createResponse({ success: true, shops, categories, areas });
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // shopsシート
  let shopsSheet = ss.getSheetByName('shops');
  if (!shopsSheet) shopsSheet = ss.insertSheet('shops');
  
  if (shopsSheet.getRange(1, 1).getValue() !== 'id') {
    const headers = ['id', 'url', 'name', 'category', 'area', 'price', 'image', 'description', 'createdAt'];
    shopsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    shopsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#333').setFontColor('#FFF');
    shopsSheet.setFrozenRows(1);
  }
  
  // categoriesシート
  let catSheet = ss.getSheetByName('categories');
  if (!catSheet) catSheet = ss.insertSheet('categories');
  
  if (catSheet.getRange(1, 1).getValue() !== 'id') {
    catSheet.getRange(1, 1, 1, 4).setValues([['id', 'name', 'isDefault', 'createdAt']]);
    catSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#333').setFontColor('#FFF');
    catSheet.setFrozenRows(1);
    
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
  
  // areasシート
  let areaSheet = ss.getSheetByName('areas');
  if (!areaSheet) areaSheet = ss.insertSheet('areas');
  
  if (areaSheet.getRange(1, 1).getValue() !== 'id') {
    areaSheet.getRange(1, 1, 1, 4).setValues([['id', 'name', 'isDefault', 'createdAt']]);
    areaSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#333').setFontColor('#FFF');
    areaSheet.setFrozenRows(1);
    
    const defaultAreas = [
      ['tokyo23', '東京23区', true, new Date().toISOString()],
      ['tokyoOther', '23区外', true, new Date().toISOString()],
      ['chiba', '千葉', true, new Date().toISOString()],
      ['kanagawa', '神奈川', true, new Date().toISOString()],
      ['saitama', '埼玉', true, new Date().toISOString()]
    ];
    areaSheet.getRange(2, 1, defaultAreas.length, 4).setValues(defaultAreas);
  }
  
  return createResponse({ success: true, message: 'セットアップ完了' });
}

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
    if (!data[i][0]) continue;
    const shop = {};
    headers.forEach((h, idx) => shop[h] = data[i][idx] || '');
    shops.push(shop);
  }
  
  return createResponse({ success: true, shops: shops });
}

function addShop(e) {
  let data;
  if (e.parameter.data) {
    data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(e.parameter.data)).getDataAsString('UTF-8'));
  } else if (e.postData && e.postData.contents) {
    data = JSON.parse(e.postData.contents);
  } else {
    return createResponse({ success: false, error: 'データがありません' });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('shops');
  if (!sheet) { setup(); sheet = ss.getSheetByName('shops'); }
  
  sheet.appendRow([
    data.id || Date.now().toString(),
    data.url || '', data.name || '', data.category || '', data.area || '',
    data.price || '', data.image || '', data.description || '',
    data.createdAt || new Date().toISOString()
  ]);
  
  return createResponse({ success: true });
}

function deleteShop(e) {
  const id = e.parameter.id;
  if (!id) return createResponse({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('shops');
  if (!sheet) return createResponse({ success: false, error: 'シートなし' });
  
  const ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: '見つからない' });
}

function updateShop(e) {
  let data;
  if (e.parameter.data) {
    data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(e.parameter.data)).getDataAsString('UTF-8'));
  } else {
    return createResponse({ success: false, error: 'データがありません' });
  }
  
  if (!data.id) return createResponse({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('shops');
  if (!sheet) return createResponse({ success: false, error: 'シートなし' });
  
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(1, 1, lastRow, 1).getValues();
  
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === data.id.toString()) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, 2).setValue(data.url || '');
      sheet.getRange(rowNum, 3).setValue(data.name || '');
      sheet.getRange(rowNum, 4).setValue(data.category || '');
      sheet.getRange(rowNum, 5).setValue(data.area || '');
      sheet.getRange(rowNum, 6).setValue(data.price || '');
      sheet.getRange(rowNum, 7).setValue(data.image || '');
      sheet.getRange(rowNum, 8).setValue(data.description || '');
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: '見つからない' });
}

function getCategories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('categories');
  if (!sheet) return createResponse({ success: true, categories: [] });
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createResponse({ success: true, categories: [] });
  
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const categories = data.filter(r => r[0]).map(r => ({
    id: r[0], name: r[1], isDefault: r[2] === true || r[2] === 'true'
  }));
  
  return createResponse({ success: true, categories: categories });
}

function addCategory(e) {
  const name = e.parameter.name;
  if (!name) return createResponse({ success: false, error: '名前が必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('categories');
  if (!sheet) { setup(); }
  
  const id = e.parameter.id || 'cat_' + Date.now();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('categories')
    .appendRow([id, name, false, new Date().toISOString()]);
  
  return createResponse({ success: true, category: { id: id, name: name, isDefault: false } });
}

function deleteCategory(e) {
  const id = e.parameter.id;
  if (!id) return createResponse({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('categories');
  if (!sheet) return createResponse({ success: false, error: 'シートなし' });
  
  const values = sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id.toString()) {
      if (values[i][2] === true || values[i][2] === 'true') {
        return createResponse({ success: false, error: 'デフォルトは削除不可' });
      }
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: '見つからない' });
}

function getAreas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('areas');
  if (!sheet) return createResponse({ success: true, areas: [] });
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createResponse({ success: true, areas: [] });
  
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const areas = data.filter(r => r[0]).map(r => ({
    id: r[0], name: r[1], isDefault: r[2] === true || r[2] === 'true'
  }));
  
  return createResponse({ success: true, areas: areas });
}

function addArea(e) {
  const name = e.parameter.name;
  if (!name) return createResponse({ success: false, error: '名前が必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('areas');
  if (!sheet) { setup(); }
  
  const id = e.parameter.id || 'area_' + Date.now();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('areas')
    .appendRow([id, name, false, new Date().toISOString()]);
  
  return createResponse({ success: true, area: { id: id, name: name, isDefault: false } });
}

function deleteArea(e) {
  const id = e.parameter.id;
  if (!id) return createResponse({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('areas');
  if (!sheet) return createResponse({ success: false, error: 'シートなし' });
  
  const values = sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id.toString()) {
      if (values[i][2] === true || values[i][2] === 'true') {
        return createResponse({ success: false, error: 'デフォルトは削除不可' });
      }
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: '見つからない' });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;

// グローバルインスタンス
const config = new Config();

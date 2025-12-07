// ===========================
// config.js - 設定管理
// ===========================

// 弁当デフォルトカテゴリ
const DEFAULT_BENTO_CATEGORIES = {
    onigiri: 'おにぎり・サンド',
    meat: '肉・魚',
    chinese: '中華',
    curry: 'カレー',
    noodle: '麺類',
    catering: 'ケータリング',
    other: 'その他'
};

// 弁当デフォルトエリア
const DEFAULT_BENTO_AREAS = {
    tokyo23: '東京23区',
    tokyoOther: '23区外',
    chiba: '千葉',
    kanagawa: '神奈川',
    saitama: '埼玉'
};

// ロケ地デフォルトカテゴリ
const DEFAULT_LOCATION_CATEGORIES = {
    office: 'オフィス',
    outdoor: '屋外',
    indoor: '屋内施設',
    nature: '自然',
    street: '街並み',
    station: '駅・交通',
    other: 'その他'
};

// ロケ地デフォルトエリア
const DEFAULT_LOCATION_AREAS = {
    tokyo23: '東京23区',
    tokyoOther: '23区外',
    chiba: '千葉',
    kanagawa: '神奈川',
    saitama: '埼玉'
};

// 動的カテゴリ・エリア
let BENTO_CATEGORIES = { all: 'すべて', ...DEFAULT_BENTO_CATEGORIES };
let BENTO_AREAS = { all: 'すべてのエリア', ...DEFAULT_BENTO_AREAS };
let LOCATION_CATEGORIES = { all: 'すべて', ...DEFAULT_LOCATION_CATEGORIES };
let LOCATION_AREAS = { all: 'すべてのエリア', ...DEFAULT_LOCATION_AREAS };

// 価格帯
const PRICE_RANGES = {
    under500: '〜500円',
    '500to800': '500〜800円',
    '800to1000': '800〜1,000円',
    over1000: '1,000円〜'
};

// 設定
const DEFAULT_CONFIG = {
    gasUrl: '',
    isSetupComplete: false
};

class Config {
    constructor() {
        this.settings = this.load();
    }

    load() {
        const saved = localStorage.getItem('lokeNaviConfig');
        if (saved) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
        return { ...DEFAULT_CONFIG };
    }

    save(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('lokeNaviConfig', JSON.stringify(this.settings));
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
        localStorage.removeItem('lokeNaviConfig');
        this.settings = { ...DEFAULT_CONFIG };
        BENTO_CATEGORIES = { all: 'すべて', ...DEFAULT_BENTO_CATEGORIES };
        BENTO_AREAS = { all: 'すべてのエリア', ...DEFAULT_BENTO_AREAS };
        LOCATION_CATEGORIES = { all: 'すべて', ...DEFAULT_LOCATION_CATEGORIES };
        LOCATION_AREAS = { all: 'すべてのエリア', ...DEFAULT_LOCATION_AREAS };
    }

    updateBentoCategories(arr) {
        BENTO_CATEGORIES = { all: 'すべて' };
        arr.forEach(c => BENTO_CATEGORIES[c.id] = c.name);
    }

    updateBentoAreas(arr) {
        BENTO_AREAS = { all: 'すべてのエリア' };
        arr.forEach(a => BENTO_AREAS[a.id] = a.name);
    }

    updateLocationCategories(arr) {
        LOCATION_CATEGORIES = { all: 'すべて' };
        arr.forEach(c => LOCATION_CATEGORIES[c.id] = c.name);
    }

    updateLocationAreas(arr) {
        LOCATION_AREAS = { all: 'すべてのエリア' };
        arr.forEach(a => LOCATION_AREAS[a.id] = a.name);
    }

    getBentoCategoriesWithoutAll() {
        const c = { ...BENTO_CATEGORIES }; delete c.all; return c;
    }
    getBentoAreasWithoutAll() {
        const a = { ...BENTO_AREAS }; delete a.all; return a;
    }
    getLocationCategoriesWithoutAll() {
        const c = { ...LOCATION_CATEGORIES }; delete c.all; return c;
    }
    getLocationAreasWithoutAll() {
        const a = { ...LOCATION_AREAS }; delete a.all; return a;
    }
}

// GASコード
const GAS_CODE = `// ===========================
// Google Apps Script - ロケナビ
// ===========================

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const action = e.parameter.action;
  try {
    switch(action) {
      case 'setup': return setup();
      case 'getAll': return getAll();
      // 弁当
      case 'getBentoShops': return getItems('bento_shops');
      case 'addBentoShop': return addItem(e, 'bento_shops');
      case 'updateBentoShop': return updateItem(e, 'bento_shops');
      case 'deleteBentoShop': return deleteItem(e, 'bento_shops');
      case 'getBentoCategories': return getCategories('bento_categories');
      case 'addBentoCategory': return addCategory(e, 'bento_categories');
      case 'deleteBentoCategory': return deleteCategory(e, 'bento_categories');
      case 'getBentoAreas': return getCategories('bento_areas');
      case 'addBentoArea': return addCategory(e, 'bento_areas');
      case 'deleteBentoArea': return deleteCategory(e, 'bento_areas');
      // ロケ地
      case 'getLocations': return getItems('locations');
      case 'addLocation': return addItem(e, 'locations');
      case 'updateLocation': return updateItem(e, 'locations');
      case 'deleteLocation': return deleteItem(e, 'locations');
      case 'getLocationCategories': return getCategories('location_categories');
      case 'addLocationCategory': return addCategory(e, 'location_categories');
      case 'deleteLocationCategory': return deleteCategory(e, 'location_categories');
      case 'getLocationAreas': return getCategories('location_areas');
      case 'addLocationArea': return addCategory(e, 'location_areas');
      case 'deleteLocationArea': return deleteCategory(e, 'location_areas');
      default: return res({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    return res({ success: false, error: error.toString() });
  }
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 弁当店舗シート
  createSheet(ss, 'bento_shops', ['id','url','name','category','area','price','image','description','createdAt']);
  
  // ロケ地シート
  createSheet(ss, 'locations', ['id','url','name','category','area','address','image','description','createdAt']);
  
  // 弁当カテゴリ
  createCategorySheet(ss, 'bento_categories', [
    ['onigiri','おにぎり・サンド',true],['meat','肉・魚',true],['chinese','中華',true],
    ['curry','カレー',true],['noodle','麺類',true],['catering','ケータリング',true],['other','その他',true]
  ]);
  
  // 弁当エリア
  createCategorySheet(ss, 'bento_areas', [
    ['tokyo23','東京23区',true],['tokyoOther','23区外',true],['chiba','千葉',true],
    ['kanagawa','神奈川',true],['saitama','埼玉',true]
  ]);
  
  // ロケ地カテゴリ
  createCategorySheet(ss, 'location_categories', [
    ['office','オフィス',true],['outdoor','屋外',true],['indoor','屋内施設',true],
    ['nature','自然',true],['street','街並み',true],['station','駅・交通',true],['other','その他',true]
  ]);
  
  // ロケ地エリア
  createCategorySheet(ss, 'location_areas', [
    ['tokyo23','東京23区',true],['tokyoOther','23区外',true],['chiba','千葉',true],
    ['kanagawa','神奈川',true],['saitama','埼玉',true]
  ]);
  
  return res({ success: true, message: 'セットアップ完了' });
}

function createSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getRange(1,1).getValue() !== 'id') {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#333').setFontColor('#FFF');
    sheet.setFrozenRows(1);
  }
}

function createCategorySheet(ss, name, defaults) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getRange(1,1).getValue() !== 'id') {
    sheet.getRange(1,1,1,4).setValues([['id','name','isDefault','createdAt']]);
    sheet.getRange(1,1,1,4).setFontWeight('bold').setBackground('#333').setFontColor('#FFF');
    sheet.setFrozenRows(1);
    const rows = defaults.map(d => [d[0], d[1], d[2], new Date().toISOString()]);
    sheet.getRange(2,1,rows.length,4).setValues(rows);
  }
}

function getAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return res({
    success: true,
    bentoShops: getItemsData(ss, 'bento_shops', 9),
    locations: getItemsData(ss, 'locations', 9),
    bentoCategories: getCategoriesData(ss, 'bento_categories'),
    bentoAreas: getCategoriesData(ss, 'bento_areas'),
    locationCategories: getCategoriesData(ss, 'location_categories'),
    locationAreas: getCategoriesData(ss, 'location_areas')
  });
}

function getItemsData(ss, sheetName, cols) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getRange(1,1,sheet.getLastRow(),cols).getValues();
  const headers = data[0];
  return data.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = r[i] || '');
    return obj;
  });
}

function getCategoriesData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues()
    .filter(r => r[0])
    .map(r => ({ id: r[0], name: r[1], isDefault: r[2] === true || r[2] === 'true' }));
}

function getItems(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return res({ success: true, items: getItemsData(ss, sheetName, 9) });
}

function addItem(e, sheetName) {
  let data;
  if (e.parameter.data) {
    data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(e.parameter.data)).getDataAsString('UTF-8'));
  } else return res({ success: false, error: 'データがありません' });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { setup(); sheet = ss.getSheetByName(sheetName); }
  
  const row = [
    data.id || Date.now().toString(),
    data.url || '', data.name || '', data.category || '', data.area || '',
    data.price || data.address || '', data.image || '', data.description || '',
    data.createdAt || new Date().toISOString()
  ];
  sheet.appendRow(row);
  return res({ success: true });
}

function updateItem(e, sheetName) {
  let data;
  if (e.parameter.data) {
    data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(e.parameter.data)).getDataAsString('UTF-8'));
  } else return res({ success: false, error: 'データがありません' });
  
  if (!data.id) return res({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return res({ success: false, error: 'シートなし' });
  
  const ids = sheet.getRange(1,1,sheet.getLastRow(),1).getValues();
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === data.id.toString()) {
      const row = i + 1;
      sheet.getRange(row,2).setValue(data.url || '');
      sheet.getRange(row,3).setValue(data.name || '');
      sheet.getRange(row,4).setValue(data.category || '');
      sheet.getRange(row,5).setValue(data.area || '');
      sheet.getRange(row,6).setValue(data.price || data.address || '');
      sheet.getRange(row,7).setValue(data.image || '');
      sheet.getRange(row,8).setValue(data.description || '');
      return res({ success: true });
    }
  }
  return res({ success: false, error: '見つからない' });
}

function deleteItem(e, sheetName) {
  const id = e.parameter.id;
  if (!id) return res({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return res({ success: false, error: 'シートなし' });
  
  const ids = sheet.getRange(1,1,sheet.getLastRow(),1).getValues();
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return res({ success: true });
    }
  }
  return res({ success: false, error: '見つからない' });
}

function getCategories(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return res({ success: true, categories: getCategoriesData(ss, sheetName) });
}

function addCategory(e, sheetName) {
  const name = e.parameter.name;
  if (!name) return res({ success: false, error: '名前が必要' });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { setup(); sheet = ss.getSheetByName(sheetName); }
  
  const id = e.parameter.id || 'cat_' + Date.now();
  sheet.appendRow([id, name, false, new Date().toISOString()]);
  return res({ success: true, category: { id, name, isDefault: false } });
}

function deleteCategory(e, sheetName) {
  const id = e.parameter.id;
  if (!id) return res({ success: false, error: 'IDが必要' });
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return res({ success: false, error: 'シートなし' });
  
  const values = sheet.getRange(1,1,sheet.getLastRow(),3).getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id.toString()) {
      if (values[i][2] === true || values[i][2] === 'true') {
        return res({ success: false, error: 'デフォルトは削除不可' });
      }
      sheet.deleteRow(i + 1);
      return res({ success: true });
    }
  }
  return res({ success: false, error: '見つからない' });
}

function res(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;

const config = new Config();

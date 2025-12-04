// ===========================
// config.js - 設定管理
// ===========================

// カテゴリマッピング
const CATEGORIES = {
    all: 'すべて',
    onigiri: 'おにぎり・サンド',
    meat: '肉・魚',
    chinese: '中華',
    curry: 'カレー',
    noodle: '麺類',
    catering: 'ケータリング',
    other: 'その他'
};

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
    isSetupComplete() {
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
  let sheet = ss.getSheetByName('shops');
  if (!sheet) {
    sheet = ss.insertSheet('shops');
  } else {
    // 既存データがある場合はクリアしない（ヘッダーのみ確認）
    const firstRow = sheet.getRange(1, 1, 1, 9).getValues()[0];
    if (firstRow[0] === 'id') {
      // 既にセットアップ済み
      return createResponse({ 
        success: true, 
        message: '既にセットアップ済みです',
        spreadsheetId: spreadsheetId,
        spreadsheetUrl: spreadsheetUrl
      });
    }
  }
  
  // ヘッダー行を設定
  const headers = ['id', 'url', 'name', 'category', 'area', 'price', 'image', 'description', 'createdAt'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#333333');
  headerRange.setFontColor('#FFFFFF');
  
  // 列幅を調整
  sheet.setColumnWidth(1, 140);  // id
  sheet.setColumnWidth(2, 250);  // url
  sheet.setColumnWidth(3, 180);  // name
  sheet.setColumnWidth(4, 120);  // category
  sheet.setColumnWidth(5, 120);  // area
  sheet.setColumnWidth(6, 100);  // price
  sheet.setColumnWidth(7, 250);  // image
  sheet.setColumnWidth(8, 300);  // description
  sheet.setColumnWidth(9, 160);  // createdAt
  
  // 1行目を固定
  sheet.setFrozenRows(1);
  
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
    if (!row[0]) continue; // IDが空の行はスキップ
    
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
    // シートがない場合はセットアップを実行
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

// JSONレスポンスを作成
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

// グローバルインスタンス
const config = new Config();
